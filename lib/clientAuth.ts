// Logout utility function
export async function logout(): Promise<void> {
  try {
    // Call the logout API to clear the secure cookie
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.warn('Logout API call failed:', error);
    // Continue with logout even if API call fails
  }
  
  // Clear any remaining localStorage data
  localStorage.removeItem('Student.creds');
  localStorage.removeItem('Student.quickStats');
  localStorage.removeItem('Student.lastReportingPeriod');
  localStorage.removeItem('Student.studentName');
  localStorage.removeItem('Student.studentPhoto');
  localStorage.removeItem('Student.studentPermId');
  localStorage.removeItem('Student.studentSchool');
  
  // Redirect to login page
  window.location.href = '/';
}

// Check if user is authenticated (has valid cookie)
export async function checkAuth(): Promise<boolean> {
  try {
    // Try to make an authenticated request to check if cookie is valid
    const response = await fetch('/api/synergy/gradebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      credentials: 'include',
    });
    
    return response.status !== 401;
  } catch {
    return false;
  }
}