import React from 'react'

const EventCard = ({ date, title, description }) => {
  return (
    <div className="event-card">
      <div className="date">{date}</div>
      <div className="title">{title}</div>
      <div className="desc">{description}</div>
    </div>
  )
}

export default EventCard