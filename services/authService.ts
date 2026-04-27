import api from "./api";
import { logger } from "./loggerService";

export const AuthService = {
  // Basic implementation of Google Login: Client side returns email/id, we send to backend to get JWT.
  // NOTE: In production, you must send the ID Token and verify it on backend.
  // For this prototype, we simulate it or rely on what Firebase was doing if we keep Firebase on client.
  // But since "complete backend" implies replacing Firebase, we'll try to use our backend.

  // Logic: Frontend UI (LoginModal) calls this. 
  // IF we are using Firebase for the popup, we can still use it to get the token, then verify on backend.
  // Or we can mock it for now if Firebase is removed.
  // Let's assume LoginModal handles the popup part using Firebase *or* we just support Email/Pass for now fully custom.
  // But to minimize breakage, if LoginModal imports firebase, we can't easily remove firebase dependency without refactoring LoginModal.
  // So let's let LoginModal do the Firebase sign in, then we take the user info and "sync" it with our backend to get a session.

  loginWithGoogle: async (token: string) => {
    try {
      const response = await api.post('/auth/google', { token });
      const { token: jwt, user } = response.data;

      localStorage.setItem('token', jwt);
      localStorage.setItem('user', JSON.stringify(user));

      logger.success('auth', 'Google login successful', { uid: user.id });
      return { uid: user.id, ...user };
    } catch (error: any) {
      logger.error('auth', 'Google login failed', error);
      throw error;
    }
  },

  loginWithEmail: async (email: string, pass: string) => {
    try {
      const response = await api.post('/auth/login', { email, password: pass });

      if (response.data.twoFactorRequired) {
        return { twoFactorRequired: true, tempToken: response.data.tempToken };
      }

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      logger.success('auth', 'Email login successful', { uid: user.id });
      return { uid: user.id, ...user };
    } catch (error: any) {
      logger.error('auth', 'Email login failed', error);
      throw error;
    }
  },

  validate2FA: async (tempToken: string, code: string) => {
    try {
      const response = await api.post('/auth/2fa/validate', { tempToken, token: code });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      logger.success('auth', '2FA validation successful', { uid: user.id });
      return { uid: user.id, ...user };
    } catch (error: any) {
      logger.error('auth', '2FA validation failed', error);
      throw error;
    }
  },

  signupWithEmail: async (email: string, pass: string, name: string) => {
    try {
      const response = await api.post('/auth/register', { email, password: pass, name });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      logger.success('auth', 'User registration successful', { uid: user.id });
      return { uid: user.id, ...user };
    } catch (error: any) {
      logger.error('auth', 'Registration failed', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      logger.info('auth', 'User logged out');
    } catch (error: any) {
      logger.error('auth', 'Logout failed', error);
    }
  },

  // Update profile
  updateUserProfile: async (user: any, data: { displayName?: string, photoURL?: string }) => {
    try {
      const response = await api.put('/auth/update-profile', {
        name: data.displayName,
        avatarUrl: data.photoURL
      });
      const updatedUser = response.data.user;

      // Update local storage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      logger.success('auth', 'Profile updated successfully', { uid: updatedUser.id });
      return updatedUser;
    } catch (error: any) {
      logger.error('auth', 'Profile update failed', error);
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      logger.success('auth', 'Password changed successfully');
    } catch (error: any) {
      logger.error('auth', 'Password change failed', error);
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      await api.post('/auth/forgot-password', { email });
      logger.success('auth', 'Password reset email requested');
    } catch (error: any) {
      logger.error('auth', 'Forgot password request failed', error);
      throw error;
    }
  },

  resetPassword: async (email: string, otp: string, password: string) => {
    try {
      await api.post('/auth/reset-password', { email, otp, password });
      logger.success('auth', 'Password reset successfully');
    } catch (error: any) {
      logger.error('auth', 'Password reset failed', error);
      throw error;
    }
  },

  upgradePlan: async (plan: string) => {
    try {
      const response = await api.put('/auth/upgrade-plan', { plan });
      const updatedUser = response.data.user;

      // Update local storage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      logger.success('auth', 'Plan upgraded successfully', { plan });
      return updatedUser;
    } catch (error: any) {
      logger.error('auth', 'Plan upgrade failed', error);
      throw error;
    }
  }
}; 