const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handleApiError = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'An unknown error occurred');
  }
  throw new Error('Failed to connect to server');
};

async function retryOperation(operation, retries = MAX_RETRIES) {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        await wait(RETRY_DELAY * (i + 1)); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

export async function findUserByEmail(email) {
  return retryOperation(async () => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'find',
        email
      })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const { user } = await response.json();
    return user;
  });
}

export async function createUser({ email, username, firebaseUid }) {
  return retryOperation(async () => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        email,
        username,
        firebaseUid
      })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const { user } = await response.json();
    return user;
  });
}

export async function updateUserFirebaseUid(email, firebaseUid) {
  return retryOperation(async () => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        email,
        firebaseUid
      })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const { user } = await response.json();
    return user;
  });
}