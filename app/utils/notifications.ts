import { db } from '../../src/firebase';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';

export interface CreateNotificationParams {
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'pod_interest' | 'message';
  title: string;
  message: string;
  actionUserId?: string;
  postId?: string;
  podId?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    // Don't send notification to yourself
    if (params.userId === params.actionUserId) {
      return;
    }

    // Get action user details if provided
    let actionUserName = '';
    let actionUserAvatar = '';
    
    if (params.actionUserId) {
      try {
        const actionUserDoc = await getDoc(doc(db, 'users', params.actionUserId));
        if (actionUserDoc.exists()) {
          const userData = actionUserDoc.data();
          actionUserName = userData.displayName || userData.name || userData.email?.split('@')[0] || 'Someone';
          actionUserAvatar = userData.profilePicture || userData.avatar || actionUserName[0]?.toUpperCase() || 'U';
        }
      } catch (error) {
        console.error('Error fetching action user details:', error);
      }
    }

    // Create notification document
    await addDoc(collection(db, 'notifications'), {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      read: false,
      createdAt: Timestamp.now(),
      actionUserId: params.actionUserId || null,
      actionUserName: actionUserName || null,
      actionUserAvatar: actionUserAvatar || null,
      postId: params.postId || null,
      podId: params.podId || null,
    });

    console.log('Notification created successfully');
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Specific notification helpers
export const createLikeNotification = async (postAuthorId: string, likerUserId: string, postId: string) => {
  await createNotification({
    userId: postAuthorId,
    type: 'like',
    title: 'New like on your post',
    message: 'Someone liked your post',
    actionUserId: likerUserId,
    postId,
  });
};

export const createCommentNotification = async (postAuthorId: string, commenterUserId: string, postId: string, commentText: string) => {
  await createNotification({
    userId: postAuthorId,
    type: 'comment',
    title: 'New comment on your post',
    message: `Someone commented: "${commentText.slice(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
    actionUserId: commenterUserId,
    postId,
  });
};

export const createFollowNotification = async (followedUserId: string, followerUserId: string) => {
  await createNotification({
    userId: followedUserId,
    type: 'follow',
    title: 'New follower',
    message: 'Someone started following you',
    actionUserId: followerUserId,
  });
};

export const createPodInterestNotification = async (podOwnerId: string, interestedUserId: string, podId: string) => {
  await createNotification({
    userId: podOwnerId,
    type: 'pod_interest',
    title: 'Pod interest',
    message: 'Someone is interested in your pod',
    actionUserId: interestedUserId,
    podId,
  });
};

export const createMessageNotification = async (recipientUserId: string, senderUserId: string, messagePreview: string) => {
  // Get sender details for a more personalized notification
  try {
    const senderDoc = await getDoc(doc(db, 'users', senderUserId));
    let senderName = 'Someone';
    if (senderDoc.exists()) {
      const userData = senderDoc.data();
      senderName = userData.displayName || userData.name || userData.email?.split('@')[0] || 'Someone';
    }

    await createNotification({
      userId: recipientUserId,
      type: 'message',
      title: 'New message',
      message: `${senderName}: "${messagePreview.slice(0, 50)}${messagePreview.length > 50 ? '...' : ''}"`,
      actionUserId: senderUserId,
    });
  } catch (error) {
    console.error('Error creating message notification:', error);
    // Fallback to basic notification
    await createNotification({
      userId: recipientUserId,
      type: 'message',
      title: 'New message',
      message: `"${messagePreview.slice(0, 50)}${messagePreview.length > 50 ? '...' : ''}"`,
      actionUserId: senderUserId,
    });
  }
};
