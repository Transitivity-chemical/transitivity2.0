import { PrismaClient, Plan } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed plan configurations (3 tiers)
  const plans = [
    {
      plan: Plan.STUDENT,
      maxCredits: 100,
      monthlyCredits: 100,
      label: 'Estudante',
      labelEn: 'Student',
      description:
        'Plano gratuito para alunos com email institucional. Inclui 100 créditos por mês.',
      descriptionEn:
        'Free plan for students with institutional email. Includes 100 credits per month.',
    },
    {
      plan: Plan.PROFESSIONAL,
      maxCredits: 1000,
      monthlyCredits: 1000,
      label: 'Profissional',
      labelEn: 'Professional',
      description:
        'Para pesquisadores e profissionais. 1000 créditos por mês, suporte prioritário.',
      descriptionEn:
        'For researchers and professionals. 1000 credits per month, priority support.',
    },
    {
      plan: Plan.ENTERPRISE,
      maxCredits: null,
      monthlyCredits: null,
      label: 'Empresarial',
      labelEn: 'Enterprise',
      description:
        'Sem limite de créditos. Para laboratórios, departamentos e empresas.',
      descriptionEn:
        'Unlimited credits. For laboratories, departments and companies.',
    },
  ];

  for (const p of plans) {
    await prisma.planConfig.upsert({
      where: { plan: p.plan },
      update: {
        maxCredits: p.maxCredits,
        monthlyCredits: p.monthlyCredits,
        label: p.label,
        labelEn: p.labelEn,
        description: p.description,
        descriptionEn: p.descriptionEn,
      },
      create: p,
    });
  }
  console.log(`Seeded ${plans.length} plan configurations`);

  // Seed institutional domains (the user's allowed-domain list)
  const domains = [
    {
      domain: 'aluno.unb.br',
      institution: 'Universidade de Brasília',
      country: 'BR',
      defaultPlan: Plan.STUDENT,
    },
    {
      domain: 'ueg.com.br',
      institution: 'Universidade Estadual de Goiás',
      country: 'BR',
      defaultPlan: Plan.STUDENT,
    },
    {
      domain: 'aluno.ueg.br',
      institution: 'Universidade Estadual de Goiás',
      country: 'BR',
      defaultPlan: Plan.STUDENT,
    },
    {
      domain: 'unb.br',
      institution: 'Universidade de Brasília',
      country: 'BR',
      defaultPlan: Plan.PROFESSIONAL,
    },
    {
      domain: 'ueg.br',
      institution: 'Universidade Estadual de Goiás',
      country: 'BR',
      defaultPlan: Plan.PROFESSIONAL,
    },
  ];

  for (const d of domains) {
    await prisma.institutionalDomain.upsert({
      where: { domain: d.domain },
      update: {
        institution: d.institution,
        country: d.country,
        defaultPlan: d.defaultPlan,
      },
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
