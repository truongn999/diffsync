export function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    json: 'json', html: 'html', htm: 'html',
    css: 'css', scss: 'scss', less: 'less',
    md: 'markdown', yaml: 'yaml', yml: 'yaml',
    xml: 'xml', svg: 'xml',
    py: 'python', rb: 'ruby', go: 'go',
    rs: 'rust', java: 'java', kt: 'kotlin',
    sh: 'shell', bash: 'shell',
    sql: 'sql', graphql: 'graphql',
    dockerfile: 'dockerfile',
    txt: 'plaintext'
  }
  return map[ext] || 'plaintext'
}