// client/src/components/AppLayout.jsx

import Navbar from "./Navbar";

// Wraps any page that should show the navbar.
// Keeps Navbar import out of every individual page component.

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FBFAF8]">
      <Navbar />
      {children}
    </div>
  );
}

export default AppLayout;
