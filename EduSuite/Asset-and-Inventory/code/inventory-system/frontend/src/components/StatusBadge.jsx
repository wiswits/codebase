const styles = {
  "In Stock": "bg-green-50 text-green-700",
  "Low Stock": "bg-amber-50 text-amber-700",
  "Out of Stock": "bg-red-50 text-red-600",
  Issued: "bg-blue-50 text-blue-700",
  Returned: "bg-green-50 text-green-700",
  "Partially Returned": "bg-amber-50 text-amber-700",
  Good: "bg-green-50 text-green-700",
  Damaged: "bg-red-50 text-red-600",
  "Needs Repair": "bg-amber-50 text-amber-700",
  Active: "bg-green-50 text-green-700",
  Inactive: "bg-gray-100 text-gray-500",
};

const StatusBadge = ({ status }) => {
  return (
    <span className={`badge ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
