import { useRouter } from "expo-router";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, firestore } from "../config/firebaseConfig";
import { AuthContextType, UserType } from "../types";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const fallbackUser: UserType = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
        };

        const hydratedUser = await updateUserData(
          firebaseUser.uid,
          fallbackUser,
        );
        setUser(hydratedUser);
        router.replace("/(tabs)");
        return;
      }

      setUser(null);
      router.replace("/(auth)/welcome");
    });

    return () => unsub();
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      console.log("Error message: ", msg);
      if (msg.includes("auth/invalid-credential")) {
        msg = "Invalid Credentials. Please check your email and password.";
      }

      if (msg.includes("auth/invalid-email")) {
        msg = "Invalid Email.";
      }

      return { success: false, msg };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const trimmedName = name.trim();

      await updateProfile(response.user, {
        displayName: trimmedName,
      });

      await setDoc(doc(firestore, "users", response.user.uid), {
        name: trimmedName,
        email,
        uid: response.user.uid,
      });

      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      console.log("Error message: ", msg);
      if (msg.includes("auth/invalid-credential")) {
        msg = "Invalid Credentials. Please check your email and password.";
      }
      if (msg.includes("auth/invalid-email")) {
        msg = "Invalid Email.";
      }
      if (msg.includes("auth/email-already-in-use")) {
        msg = "This email is already in use.";
      }
      return { success: false, msg };
    }
  };

  const updateUserData = async (
    uid: string,
    fallbackUser: UserType = null,
  ): Promise<UserType> => {
    try {
      const docRef = doc(firestore, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const userData: UserType = {
          uid: data?.uid,
          email: data.email || null,
          name: data.name || null,
          image: data.image || null,
        };
        return { ...userData };
      }

      return fallbackUser;
    } catch (error: any) {
      console.log("error: ", error);
      return fallbackUser;
    }

    return fallbackUser;
  };

  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    register,
    updateUserData,
  };
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be wrapped inside AuthProvider");
  }
  return context;
};
