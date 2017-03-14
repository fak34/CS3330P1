This is a Node.js script to pre-process the data using the d3 library,
and write out JSON files to be used in the visualization.

This script requires a lot of memory, and will likely fail with default settings.
Run it (from this directory!) by executing "node --max_old_space_size=4096 .", if you have NodeJS v6 installed
(v7 should also work, but is untested).
This will run the script with Node.js set to use up to 4GB of memory.

Like most Node.js software, this script uses npm to manage packages,
so the node_modules directory contains unmodified third-party library code.
(The only direct dependency is d3, but d3 has its own dependencies.)