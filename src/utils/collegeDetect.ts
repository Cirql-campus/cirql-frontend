export const COLLEGE_MAP = [
  { domain: 'kiet.edu',       name: 'KIET Group of Institutions' },
  { domain: 'akgec.ac.in',    name: 'AKGEC Ghaziabad' },
  { domain: 'gl.ac.in',       name: 'Galgotias University' },
  { domain: 'hbtu.ac.in',     name: 'HBTU Kanpur' },
  { domain: 'dtu.ac.in',      name: 'Delhi Technological University (DTU)' },
  { domain: 'iitd.ac.in',     name: 'IIT Delhi' },
  { domain: 'nsut.ac.in',     name: 'NSUT Delhi' },
  { domain: 'igdtuw.ac.in',   name: 'IGDTUW Delhi' },
  { domain: 'jiit.ac.in',     name: 'JIIT Noida' },
  { domain: 'amity.edu',      name: 'Amity University' },
  { domain: 'iiitd.ac.in',    name: 'IIIT Delhi' },
  { domain: 'bvcoend.ac.in',  name: 'Bharati Vidyapeeth College of Engineering' },
  { domain: 'ipec.org.in',    name: 'IPEC Ghaziabad' },
  { domain: 'abesit.in',      name: 'ABES Institute of Technology' },
  { domain: 'abes.ac.in',     name: 'ABES Engineering College' },
  { domain: 'niet.co.in',     name: 'NIET Greater Noida' },
  { domain: 'gniot.net.in',   name: 'GNIOT Greater Noida' },
  { domain: 'jssaten.ac.in',  name: 'JSS Academy Noida' },
  { domain: 'mait.ac.in',     name: 'MAIT Delhi' },
  { domain: 'msit.in',        name: 'MSIT Delhi' },
  { domain: 'bpitindia.com',  name: 'BPIT Delhi' },
  { domain: 'its.edu.in',     name: 'ITS Engineering College' },
  { domain: 'imsec.ac.in',    name: 'IMS Engineering College' },
  { domain: 'galgotiascollege.edu', name: 'Galgotias College of Engineering' },
  { domain: 'niet.co.in',     name: 'NIET Greater Noida' }
];

export const detectCollege = (email: string): { college: string, domain: string } | null => {
  if (!email || typeof email !== 'string') return null;
  const lower = email.toLowerCase().trim();
  const at = lower.indexOf('@');
  if (at === -1) return null;
  const domain = lower.slice(at + 1);

  // Check against known map first
  const found = COLLEGE_MAP.find(
    e => domain === e.domain || domain.endsWith('.' + e.domain)
  );
  if (found) return { college: found.name, domain: found.domain };

  // Accept any *.edu or *.ac.in generically
  if (domain.endsWith('.edu') || domain.endsWith('.ac.in')) {
    const label = domain.split('.')[0];
    return {
      college: label.charAt(0).toUpperCase() + label.slice(1) + ' University',
      domain,
    };
  }

  return null;
};
