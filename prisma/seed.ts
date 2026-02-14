import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed institutional domains
  const domains = [
    { domain: 'unb.br', institution: 'Universidade de Brasília', country: 'BR' },
    { domain: 'ueg.br', institution: 'Universidade Estadual de Goiás', country: 'BR' },
    { domain: 'usp.br', institution: 'Universidade de São Paulo', country: 'BR' },
    { domain: 'unicamp.br', institution: 'Universidade Estadual de Campinas', country: 'BR' },
    { domain: 'ufrj.br', institution: 'Universidade Federal do Rio de Janeiro', country: 'BR' },
  ];

  for (const d of domains) {
    await prisma.institutionalDomain.upsert({
      where: { domain: d.domain },
      update: {},
      create: d,
    });
  }
  console.log(`Seeded ${domains.length} institutional domains`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
