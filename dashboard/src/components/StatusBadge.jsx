export default function StatusBadge({ status }) {
  const map = {
    operational: ['badge-green', 'Operational'],
    complete: ['badge-green', 'Complete'],
    degraded: ['badge-yellow', 'Degraded'],
    outage: ['badge-red', 'Outage'],
    unreachable: ['badge-red', 'Unreachable'],
    failed: ['badge-red', 'Failed'],
    crawling: ['badge-blue', 'Crawling'],
    comprehending: ['badge-blue', 'Processing'],
    storing: ['badge-blue', 'Storing'],
    pending: ['badge-gray', 'Pending'],
    unknown: ['badge-gray', 'Unknown'],
  }
  const [cls, label] = map[status] || ['badge-gray', status]
  return <span className={`badge ${cls}`}>{label}</span>
}
