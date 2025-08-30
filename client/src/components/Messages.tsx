type MessageProps = {
  error: string;
  success: string;
};

export function Messages({ error, success }: MessageProps) {
  if (!error && !success) return null;

  return (
    <div className="mt-3">
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
}
