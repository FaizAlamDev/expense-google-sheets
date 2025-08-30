type MessageProps = {
  error: string;
  success: string;
};

export function Messages({ error, success }: MessageProps) {
  if (!error && !success) return null;

  return (
    <div>
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
