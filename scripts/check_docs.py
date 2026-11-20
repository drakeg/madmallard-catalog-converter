from pathlib import Path
r=Path(__file__).resolve().parents[1]
for name in ['README.md','AGENTS.md','CONTRIBUTING.md','SPRINTS.md','BACKLOG.md','RELEASES.md','SECURITY.md','PILOT.md','THIRD_PARTY.md']:
 assert (r/name).is_file() and (r/name).read_text().strip(), name
s=(r/'README.md').read_text(); assert s.splitlines()[0]=='# Mad Mallard Catalog Converter'
assert s.splitlines()[2].startswith('[![')
for wf in ['ci.yml','pages.yml']:
 assert (r/'.github/workflows'/wf).exists() and f'actions/workflows/{wf}/badge.svg' in s
assert (r/'LICENSE').exists() and 'img.shields.io/github/license/' in s
print('Documentation and badge claims verified')
