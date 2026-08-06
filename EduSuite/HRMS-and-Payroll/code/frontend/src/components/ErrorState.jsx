// frontend/src/components/ErrorState.jsx
function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">😵</div>
      <h3 className="text-xl font-semibold text-red-600 mb-2">Oops! Error</h3>
      <p className="text-gray-500 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          🔄 Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;