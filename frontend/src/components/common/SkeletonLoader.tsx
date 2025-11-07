import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  className?: string;
}

export const SkeletonLoader = ({ width = '100%', height = '1rem', className = '' }: SkeletonLoaderProps) => {
  return (
    <div 
      className={`skeleton-loader ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonTable = ({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLoader key={i} width="100%" height="2rem" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <SkeletonLoader key={colIndex} width="100%" height="1.5rem" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <SkeletonLoader width="60%" height="1.5rem" className="skeleton-title" />
      <SkeletonLoader width="100%" height="1rem" className="skeleton-line" />
      <SkeletonLoader width="80%" height="1rem" className="skeleton-line" />
      <SkeletonLoader width="90%" height="1rem" className="skeleton-line" />
    </div>
  );
};


