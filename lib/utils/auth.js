import { auth } from './firebase-admin';

export async function verifyAuthToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid token');
  }
}

export async function validateRequest(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const decodedToken = await verifyAuthToken(authHeader);
    return decodedToken;
  } catch (error) {
    return null;
  }
}
