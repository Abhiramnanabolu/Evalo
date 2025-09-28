'use client'

import { AuthForm } from "../../../components/authform"

const IconGoogle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}><title>Google</title><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.386-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.85l3.25-3.138C18.189 1.186 15.479 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.885 0 11.954-4.823 11.954-12.015 0-.795-.084-1.588-.239-2.356H12.24z" fill="currentColor"/></svg>
);


const SignupForm = () => {

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <AuthForm
        logoSrc="/Logo1.png"
        logoAlt="Evalo Logo"
        title="Create Account"
        description="Sign up with your Google account to get started."
        primaryAction={{
          label: "Continue with Google",
          icon: <IconGoogle className="mr-2 h-4 w-4" />,
          onClick: () => alert("Google signup clicked"),
        }}
        skipAction={{
          label: "Skip for now",
          onClick: () => alert("Skip clicked"),
        }}
        
      />
    </div>
  );
};

export default SignupForm;
