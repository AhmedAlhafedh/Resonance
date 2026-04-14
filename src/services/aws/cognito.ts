// ============================================================
// AWS COGNITO AUTH INTEGRATION POINT  
// ============================================================
// Current: Returns mock user after simulated delay
// Replace: Use AWS Amplify Auth or Cognito SDK
//   import { Auth } from 'aws-amplify';
//   import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
// ============================================================

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    plan: 'free' | 'pro' | 'team';
    institution?: string;
}

let currentUser: User | null = null;

/**
 * AWS_INTEGRATION: Replace with Amplify Auth.signIn() / Cognito SDK
 * 
 * Real implementation:
 *   import { signIn, getCurrentUser } from 'aws-amplify/auth';
 *   const user = await signIn({ username: email, password });
 */
export async function simulateAuth(): Promise<User> {
    if (currentUser) return currentUser;

    await new Promise((r) => setTimeout(r, 300));

    currentUser = {
        id: 'user-demo-001',
        name: 'Ahmed Basem',
        email: 'ahmed.basem@university.edu',
        avatarUrl: undefined,
        plan: 'pro',
        institution: 'MIT',
    };

    return currentUser;
}

/**
 * AWS_INTEGRATION: Replace with Amplify Auth.signOut()
 */
export async function simulateSignOut(): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
    currentUser = null;
}

/**
 * AWS_INTEGRATION: Replace with Amplify Auth.getCurrentUser()
 */
export function getCurrentUser(): User | null {
    return currentUser;
}
