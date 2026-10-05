# Frontend Code Style

Sources: [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html) and [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html). The project adopts relevant naming, indentation, and DOM conventions. CSS currently uses compact formatting.

- Use two-space JavaScript indentation, single quotes, and semicolons. Prefer const; use let when reassignment is necessary.
- Use camelCase for functions and variables and uppercase names for configuration constants.
- Use async/await and centralize requests, timeouts, and error handling.
- Insert API content through textContent instead of constructing HTML from user input.
- Collect expressions and display backend results; do not calculate final answers in the frontend.
- Give controls descriptive labels. Use label or aria-label for inputs and aria-live or role=status for status updates.
- Keep interface text, accessibility labels, CSV headers, and documentation in English.
- Keep the service URL in src/config.js. Do not store credentials in source code.
