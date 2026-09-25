
export default function App() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-6 space-y-4">
      {/* daisyUI Card */}
      <div className="card w-96 bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Success! 🎉</h2>
          <p>Tailwind CSS & daisyUI are now working properly in React.</p>
          <div className="card-actions justify-end mt-4">
            <button className="btn btn-primary">Primary Button</button>
            <button className="btn btn-accent">Accent Button</button>
          </div>
        </div>
      </div>

      {/* daisyUI Alert */}
      <div className="alert alert-success max-w-96 shadow-md">
        <span>daisyUI plugin active!</span>
      </div>
    </div>
  );
}