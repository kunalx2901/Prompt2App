import { Link } from 'react-router-dom'

export default function ProjectCard({ project }) {
  return (
    <Link to={`/project/${project.id}`} className="project-card">
      <div className="project-card-top">
        <p className="badge">Project</p>
        <span className="project-date">Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
      </div>
      <h3>{project.name}</h3>
      <p>{project.description || 'No description provided.'}</p>
    </Link>
  )
}
