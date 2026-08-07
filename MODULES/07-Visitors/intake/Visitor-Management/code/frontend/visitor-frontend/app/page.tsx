import Link from "next/link";

const modules = [
  {
    number: "01",
    title: "Visitor Dashboard",
    description:
      "Monitor visitor activity, active visits, passes, and operational insights from one workspace.",
    href: "/dashboard",
    action: "Open Dashboard",
    icon: "◫",
  },
  {
    number: "02",
    title: "Visitor Log",
    description:
      "Browse visitor records, hosts, visit purposes, statuses, and complete visitor history.",
    href: "/visitors",
    action: "View Visitor Log",
    icon: "≡",
  },
  {
    number: "03",
    title: "Visitor Check-In",
    description:
      "Register visitors, assign hosts, capture visit information, and begin the visitor lifecycle.",
    href: "/visitors/check-in",
    action: "Check In Visitor",
    icon: "+",
  },
];

const lifecycle = [
  "Registration",
  "Check-In",
  "Visitor Details",
  "Pass Management",
  "Check-Out",
  "History",
];

export default function HomePage() {
  return (
    <main className="home-page fade-in">
      {/* HERO */}

      <section className="home-hero">
        <div className="home-hero-glow" />

        <div className="home-hero-content">
          <div className="home-brand">
            <span className="home-brand-mark">E</span>

            <div>
              <span className="home-brand-name">
                EduSuite
              </span>

              <span className="home-brand-product">
                Visitor Management
              </span>
            </div>
          </div>

          <div className="home-hero-grid">
            <div className="home-hero-copy">
              <div className="home-eyebrow">
                <span className="home-eyebrow-dot" />
                CAMPUS OPERATIONS
              </div>

              <h1>
                A smarter way to manage
                <span> every campus visit.</span>
              </h1>

              <p>
                A unified visitor management workspace for
                registrations, secure check-ins, host
                coordination, digital passes and complete
                visitor lifecycle tracking.
              </p>

              <div className="home-hero-actions">
                <Link
                  href="/dashboard"
                  className="home-primary-action"
                >
                  Open Dashboard
                  <span>→</span>
                </Link>

                <Link
                  href="/visitors/check-in"
                  className="home-secondary-action"
                >
                  + Check In Visitor
                </Link>
              </div>
            </div>

            <div className="home-hero-panel">
              <div className="home-panel-top">
                <div>
                  <span className="home-panel-label">
                    SYSTEM STATUS
                  </span>

                  <h3>Visitor Operations</h3>
                </div>

                <span className="home-live-badge">
                  <span />
                  LIVE
                </span>
              </div>

              <div className="home-panel-grid">
                <div className="home-mini-stat">
                  <span>01</span>
                  <strong>Registration</strong>
                  <p>Visitor identity & visit details</p>
                </div>

                <div className="home-mini-stat">
                  <span>02</span>
                  <strong>Host Assignment</strong>
                  <p>Connect visitors with hosts</p>
                </div>

                <div className="home-mini-stat">
                  <span>03</span>
                  <strong>Digital Pass</strong>
                  <p>Secure visitor access workflow</p>
                </div>

                <div className="home-mini-stat">
                  <span>04</span>
                  <strong>Visit Tracking</strong>
                  <p>Complete lifecycle visibility</p>
                </div>
              </div>

              <div className="home-panel-footer">
                <span>EduSuite Visitor System</span>
                <strong>Operational</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OPERATIONS */}

      <section className="home-content">
        <div className="home-section-heading">
          <div>
            <span className="home-section-kicker">
              CORE WORKSPACE
            </span>

            <h2>Visitor Operations</h2>

            <p>
              Everything your team needs to manage visitor
              activity efficiently.
            </p>
          </div>

          <Link
            href="/visitors"
            className="home-text-link"
          >
            View all visitors →
          </Link>
        </div>

        <div className="home-module-grid">
          {modules.map((module) => (
            <Link
              href={module.href}
              key={module.title}
              className="home-module-card"
            >
              <div className="home-module-card-top">
                <div className="home-module-icon">
                  {module.icon}
                </div>

                <span className="home-module-number">
                  {module.number}
                </span>
              </div>

              <h3>{module.title}</h3>

              <p>{module.description}</p>

              <div className="home-module-action">
                {module.action}
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* LIFECYCLE */}

        <section className="home-lifecycle">
          <div className="home-lifecycle-copy">
            <span className="home-section-kicker">
              VISITOR LIFECYCLE
            </span>

            <h2>
              From arrival to departure,
              <br />
              every step connected.
            </h2>

            <p>
              EduSuite keeps the complete visitor journey
              organized and accessible through one
              integrated workflow.
            </p>
          </div>

          <div className="home-lifecycle-flow">
            {lifecycle.map((item, index) => (
              <div
                className="home-lifecycle-step"
                key={item}
              >
                <div className="home-step-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <strong>{item}</strong>

                  <span>
                    {index === 0
                      ? "Visitor enters the system"
                      : index === 1
                        ? "Visit officially begins"
                        : index === 2
                          ? "Profile and visit information"
                          : index === 3
                            ? "Visitor access credentials"
                            : index === 4
                              ? "Visit completion"
                              : "Permanent visit record"}
                  </span>
                </div>

                {index < lifecycle.length - 1 && (
                  <div className="home-step-line" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM CTA */}

        <section className="home-bottom-cta">
          <div>
            <span className="home-section-kicker light">
              READY FOR THE NEXT VISITOR?
            </span>

            <h2>Start a secure visitor check-in.</h2>

            <p>
              Register visitor information, assign their
              host and begin the visit workflow.
            </p>
          </div>

          <Link
            href="/visitors/check-in"
            className="home-gold-action"
          >
            Check In Visitor
            <span>→</span>
          </Link>
        </section>
      </section>
    </main>
  );
}