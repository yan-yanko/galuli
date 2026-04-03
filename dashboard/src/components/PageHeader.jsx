export default function PageHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}
