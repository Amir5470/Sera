import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export const deleteAccount = async (
  uid: string,
  schoolId: string,
  password?: string,
) => {
  const user = auth.currentUser;
  if (!user || user.uid !== uid) throw new Error("Not authenticated");

  try {
    console.log("Starting account deletion for:", uid, "school:", schoolId);

    // Step 1: Delete from userIndex
    console.log("Deleting from userIndex...");
    await deleteDoc(doc(db, "userIndex", uid));
    console.log("✓ Deleted from userIndex");

    // Step 2: Delete from school users
    console.log("Deleting from school users...");
    await deleteDoc(doc(db, "schools", schoolId, "users", uid));
    console.log("✓ Deleted from school users");

    // Step 3: Delete user's posts and reactions
    console.log("Deleting posts...");
    const postsRef = collection(db, "schools", schoolId, "posts");
    const postsSnap = await getDocs(postsRef);
    console.log(`Found ${postsSnap.docs.length} posts to check`);

    for (const postDoc of postsSnap.docs) {
      if (postDoc.data().authorId === uid) {
        console.log(`Deleting post ${postDoc.id}`);

        // Delete reactions first
        const reactionsRef = collection(postDoc.ref, "reactions");
        const reactionsSnap = await getDocs(reactionsRef);
        for (const reactionDoc of reactionsSnap.docs) {
          await deleteDoc(reactionDoc.ref);
        }

        // Then delete the post
        await deleteDoc(postDoc.ref);
      } else {
        // Delete user's reactions on other posts
        const reactionsRef = collection(postDoc.ref, "reactions");
        const reactionsSnap = await getDocs(reactionsRef);
        for (const reactionDoc of reactionsSnap.docs) {
          if (reactionDoc.data().authorId === uid) {
            console.log(
              `Deleting reaction ${reactionDoc.id} on post ${postDoc.id}`,
            );
            await deleteDoc(reactionDoc.ref);
          }
        }
      }
    }
    console.log("✓ Deleted posts and reactions");

    // Step 4: Remove from classes
    console.log("Removing from classes...");
    const classesRef = collection(db, "schools", schoolId, "classes");
    const classesSnap = await getDocs(classesRef);
    console.log(`Found ${classesSnap.docs.length} classes to check`);

    for (const classDoc of classesSnap.docs) {
      const memberRef = doc(classDoc.ref, "members", uid);
      const memberSnap = await getDoc(memberRef);

      if (memberSnap.exists()) {
        console.log(`Removing from class ${classDoc.id}`);

        // Delete messages first
        const messagesRef = collection(classDoc.ref, "messages");
        const messagesSnap = await getDocs(messagesRef);
        for (const msgDoc of messagesSnap.docs) {
          if (msgDoc.data().authorId === uid) {
            await deleteDoc(msgDoc.ref);
          }
        }

        // Then delete membership
        await deleteDoc(memberRef);
      }
    }
    console.log("✓ Removed from classes");

    // Step 5: Remove from clubs
    console.log("Removing from clubs...");
    const clubsRef = collection(db, "schools", schoolId, "clubs");
    const clubsSnap = await getDocs(clubsRef);
    console.log(`Found ${clubsSnap.docs.length} clubs to check`);

    for (const clubDoc of clubsSnap.docs) {
      const memberRef = doc(clubDoc.ref, "members", uid);
      const memberSnap = await getDoc(memberRef);

      if (memberSnap.exists()) {
        console.log(`Removing from club ${clubDoc.id}`);

        // Delete messages first
        const messagesRef = collection(clubDoc.ref, "messages");
        const messagesSnap = await getDocs(messagesRef);
        for (const msgDoc of messagesSnap.docs) {
          if (msgDoc.data().authorId === uid) {
            await deleteDoc(msgDoc.ref);
          }
        }

        // Then delete membership
        await deleteDoc(memberRef);
      }
    }
    console.log("✓ Removed from clubs");

    // Step 6: Delete bell schedule votes
    console.log("Deleting bell schedule votes...");
    const dailyScheduleRef = collection(
      db,
      "schools",
      schoolId,
      "dailySchedule",
    );
    const dailyScheduleSnap = await getDocs(dailyScheduleRef);

    for (const scheduleDoc of dailyScheduleSnap.docs) {
      const data = scheduleDoc.data();
      if (data.votes && data.votes[uid]) {
        const updatedVotes = { ...data.votes };
        delete updatedVotes[uid];
        await deleteDoc(
          doc(db, "schools", schoolId, "dailySchedule", scheduleDoc.id),
        );
      }
    }
    console.log("✓ Deleted bell schedule votes");

    // Step 7: Delete Firebase Auth account (MUST BE LAST)
    try {
      console.log("Attempting to delete Auth account...");
      await deleteUser(user);
    } catch (error: any) {
      // If it fails because of a sensitive action, we need a fresh login
      if (error.code === "auth/requires-recent-login" && password) {
        console.log("Re-authenticating user...");
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
        await deleteUser(user); // Try again after re-auth
      } else {
        throw error;
      }
    }

    console.log("✓ Account fully purged from Auth and DB");
  } catch (error: any) {
    console.error("Final Deletion Error:", error.code, error.message);
    throw error;
  }
};
