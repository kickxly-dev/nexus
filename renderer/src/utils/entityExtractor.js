// ─── Entity extraction from stream output lines ───────────────────────────────

const IP_RE      = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g
const DOMAIN_RE  = /\b(?!(?:\d{1,3}\.){3}\d{1,3}\b)((?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})\b/g
const EMAIL_RE   = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g
const URL_RE     = /https?:\/\/[^\s"'<>]+/g
const HASH_RE    = /\b([0-9a-fA-F]{128}|[0-9a-fA-F]{64}|[0-9a-fA-F]{40}|[0-9a-fA-F]{32})\b/g
const CVE_RE     = /\b(CVE-\d{4}-\d{4,7})\b/gi
const PORT_RE    = /(?::(\d{2,5})\b|(?:port\s+)(\d{2,5})\b)/gi

function dedup(arr) {
  return [...new Set(arr)].sort()
}

function extractFromText(text, re) {
  const matches = []
  let m
  re.lastIndex = 0
  while ((m = re.exec(text)) !== null) {
    matches.push(m[1] || m[2] || m[0])
  }
  return matches
}

export function extractEntities(lines) {
  const result = {
    ips: [],
    domains: [],
    emails: [],
    urls: [],
    hashes: [],
    cves: [],
    ports: [],
  }

  const texts = lines.map(l => l.message ?? JSON.stringify(l))

  for (const text of texts) {
    // Emails before domains so foo@bar.com doesn't also produce bar.com as domain
    const emailMatches = extractFromText(text, EMAIL_RE)
    result.emails.push(...emailMatches)

    // Strip emails from text before domain extraction to avoid false positives
    const textNoEmail = text.replace(EMAIL_RE, '')
    EMAIL_RE.lastIndex = 0

    // URLs before domains
    const urlMatches = extractFromText(text, URL_RE)
    result.urls.push(...urlMatches)

    result.ips.push(...extractFromText(text, IP_RE))
    result.domains.push(...extractFromText(textNoEmail, DOMAIN_RE))
    result.hashes.push(...extractFromText(text, HASH_RE))

    // CVEs
    const cveMatches = []
    let m
    CVE_RE.lastIndex = 0
    while ((m = CVE_RE.exec(text)) !== null) {
      cveMatches.push(m[1])
    }
    result.cves.push(...cveMatches)

    // Ports
    const portMatches = []
    PORT_RE.lastIndex = 0
    while ((m = PORT_RE.exec(text)) !== null) {
      portMatches.push(m[1] || m[2])
    }
    result.ports.push(...portMatches)
  }

  // Remove domains that are actually part of URLs or emails
  const urlDomainParts = result.urls.map(u => {
    try { return new URL(u).hostname } catch { return null }
  }).filter(Boolean)

  return {
    ips:     dedup(result.ips),
    domains: dedup(result.domains.filter(d => !urlDomainParts.includes(d))),
    emails:  dedup(result.emails),
    urls:    dedup(result.urls),
    hashes:  dedup(result.hashes),
    cves:    dedup(result.cves.map(c => c.toUpperCase())),
    ports:   dedup(result.ports),
  }
}

export function suggestTool(type) {
  switch (type) {
    case 'ip':
      return [
        { path: '/recon', toolId: 'GeoIP',      label: 'GeoIP' },
        { path: '/recon', toolId: 'Ports',       label: 'Port Scan' },
        { path: '/recon', toolId: 'ReverseDNS',  label: 'Reverse DNS' },
        { path: '/osint', toolId: 'IPRep',       label: 'IP Reputation' },
      ]
    case 'domain':
      return [
        { path: '/recon', toolId: 'DNS',         label: 'DNS' },
        { path: '/recon', toolId: 'WHOIS',       label: 'WHOIS' },
        { path: '/recon', toolId: 'Subdomains',  label: 'Subdomains' },
        { path: '/recon', toolId: 'CertSearch',  label: 'Cert Logs' },
      ]
    case 'email':
      return [
        { path: '/osint', toolId: 'Email',       label: 'Email Recon' },
        { path: '/osint', toolId: 'Breach',      label: 'Breach Check' },
      ]
    case 'url':
      return [
        { path: '/web',   toolId: 'Headers',     label: 'Headers' },
        { path: '/web',   toolId: 'CORS',        label: 'CORS' },
        { path: '/web',   toolId: 'CSP',         label: 'CSP Analyzer' },
      ]
    case 'hash':
      return [
        { path: '/password', toolId: 'Identify', label: 'Hash ID' },
        { path: '/password', toolId: 'Crack',    label: 'Crack' },
        { path: '/password', toolId: 'HashLookup', label: 'Hash Lookup' },
      ]
    case 'cve':
      return [
        { path: '/recon', toolId: 'Fingerprint', label: 'Fingerprint' },
      ]
    case 'port':
      return [
        { path: '/recon', toolId: 'Ports',       label: 'Port Scan' },
        { path: '/recon', toolId: 'BannerGrab',  label: 'Banner Grab' },
      ]
    default:
      return []
  }
}
