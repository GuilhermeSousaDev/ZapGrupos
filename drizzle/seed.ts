import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { categories } from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida no .env");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const seedCategories = [
  {
    name: "Empregos",
    slug: "empregos",
    description: "Grupos de oportunidades de trabalho e recrutamento",
    icon: "💼",
    color: "#3B82F6",
  },
  {
    name: "Criptomoedas",
    slug: "criptomoedas",
    description: "Grupos sobre blockchain, NFTs e criptomoedas",
    icon: "₿",
    color: "#F59E0B",
  },
  {
    name: "Negócios",
    slug: "negocios",
    description: "Empreendedorismo, startups e oportunidades de negócios",
    icon: "📈",
    color: "#10B981",
  },
  {
    name: "Educação",
    slug: "educacao",
    description: "Cursos, aprendizado e desenvolvimento profissional",
    icon: "🎓",
    color: "#8B5CF6",
  },
  {
    name: "Marketing",
    slug: "marketing",
    description: "Estratégias de marketing digital e crescimento",
    icon: "📱",
    color: "#EC4899",
  },
  {
    name: "Programação",
    slug: "programacao",
    description: "Desenvolvimento web, mobile e software",
    icon: "💻",
    color: "#06B6D4",
  },
  {
    name: "Design",
    slug: "design",
    description: "UI/UX, graphic design e criatividade",
    icon: "🎨",
    color: "#F97316",
  },
  {
    name: "Saúde & Wellness",
    slug: "saude-wellness",
    description: "Fitness, nutrição e bem-estar",
    icon: "💪",
    color: "#14B8A6",
  },
  {
    name: "Lifestyle",
    slug: "lifestyle",
    description: "Moda, decoração e estilo de vida",
    icon: "👗",
    color: "#EF4444",
  },
  {
    name: "Imóveis",
    slug: "imoveis",
    description: "Compra, venda e aluguel de imóveis",
    icon: "🏠",
    color: "#F59E0B",
  },
  {
    name: "Entretenimento",
    slug: "entretenimento",
    description: "Filmes, séries, games e diversão",
    icon: "🎬",
    color: "#EC4899",
  },
  {
    name: "Community",
    slug: "community",
    description: "Comunidades, networking e conexões",
    icon: "👥",
    color: "#3B82F6",
  },
];

async function seed() {
  try {
    console.log("🌱 Iniciando seed das categorias...");

    for (const category of seedCategories) {
      await db
        .insert(categories)
        .values({ ...category, groupCount: 0 })
        .onDuplicateKeyUpdate({ set: { name: category.name } });
      console.log(`✅ Categoria criada/existente: ${category.name}`);
    }

    console.log("🎉 Seed concluído com sucesso!");
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    await connection.end();
    process.exit(1);
  }
}

seed();