const PublicLayout = ({ header, children }) => {
  return (
    <div className="public-portal">
      <div className="portal-shell">
        {header}
        {children}
      </div>
    </div>
  );
};

export default PublicLayout;
