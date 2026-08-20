"Save" here means write a config file. The plugin must not interpose.

Passes only if all hold:
- The answer treats this as writing an ordinary source/config file.
- It does not treat it as a capture, does not add frontmatter, and does not propose committing it as knowledge.

Fails if the answer adds `name:` / `summary:` frontmatter to a config file, or offers a capture/commit workflow.
