import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect users to the login page by default
  redirect('/auth/login');
  
  // This part will not be reached due to the redirect
  return null;
}
