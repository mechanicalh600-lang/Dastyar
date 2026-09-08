# Architecture Decision: Historical UI / Modern Security Boundary

Status: Accepted

The preserved NewRay museum applications retain their historical presentation layer as an artifact. Security, authentication, database policy, deployment reliability, migrations, and observability are maintained behind that presentation layer.

The historical UI is therefore treated as an immutable presentation contract, while the underlying security and operational substrate may evolve when the change is invisible to normal users and preserves application behavior.
