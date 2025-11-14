const CountryBusinessFields = require("../models/CountryBusinessFields");

const countryFieldsData = [
  {
    country: "India",
    countryCode: "IN",
    fields: [
      {
        name: "cin",
        label: "Corporate Identification Number (CIN)",
        type: "text",
        placeholder: "Enter your CIN (e.g., U12345MH2020PTC123456)",
        required: true,
        documentType: "incorporation_certificate",
        documentLabel: "Certificate of Incorporation",
      },
      {
        name: "gstin",
        label: "GST Identification Number (GSTIN)",
        type: "text",
        placeholder: "Enter your GSTIN (e.g., 27AAAAA0000A1Z5)",
        required: true,
        documentType: "tax_certificate",
        documentLabel: "GST Certificate",
      },
      {
        name: "pan",
        label: "Permanent Account Number (PAN)",
        type: "text",
        placeholder: "Enter your PAN (e.g., ABCDE1234F)",
        required: true,
        documentType: "other",
        documentLabel: "PAN Card",
      },
      {
        name: "businessType",
        label: "Business Type",
        type: "select",
        required: true,
        options: [
          { value: "Private Limited Company", label: "Private Limited Company" },
          { value: "Public Limited Company", label: "Public Limited Company" },
          { value: "LLP", label: "Limited Liability Partnership" },
          { value: "Partnership", label: "Partnership" },
          { value: "Sole Proprietorship", label: "Sole Proprietorship" },
          { value: "One Person Company", label: "One Person Company" },
        ],
      },
    ],
  },
  {
    country: "United States",
    countryCode: "US",
    fields: [
      {
        name: "ein",
        label: "Employer Identification Number (EIN)",
        type: "text",
        placeholder: "Enter your EIN (e.g., 12-3456789)",
        required: true,
        documentType: "tax_certificate",
        documentLabel: "EIN Confirmation Letter",
      },
      {
        name: "businessType",
        label: "Business Type",
        type: "select",
        required: true,
        options: [
          { value: "LLC", label: "LLC (Limited Liability Company)" },
          { value: "Corporation", label: "Corporation (C-Corp)" },
          { value: "S-Corporation", label: "S-Corporation" },
          { value: "Partnership", label: "Partnership" },
          { value: "Sole Proprietorship", label: "Sole Proprietorship" },
          { value: "Non-Profit", label: "Non-Profit" },
        ],
      },
      {
        name: "stateOfIncorporation",
        label: "State of Incorporation",
        type: "select",
        required: true,
        placeholder: "Select state",
        documentType: "incorporation_certificate",
        documentLabel: "Articles of Incorporation",
      },
    ],
  },
  {
    country: "China",
    countryCode: "CN",
    fields: [
      {
        name: "unifiedSocialCreditCode",
        label: "Unified Social Credit Code",
        type: "text",
        placeholder: "Enter your Unified Social Credit Code (18 digits)",
        required: true,
        documentType: "business_license",
        documentLabel: "Business License",
      },
      {
        name: "taxRegistrationNumber",
        label: "Tax Registration Number",
        type: "text",
        placeholder: "Enter your Tax Registration Number",
        required: true,
        documentType: "tax_certificate",
        documentLabel: "Tax Registration Certificate",
      },
      {
        name: "businessType",
        label: "Business Type",
        type: "select",
        required: true,
        options: [
          { value: "Limited Liability Company", label: "Limited Liability Company (有限责任公司)" },
          { value: "Joint Stock Company", label: "Joint Stock Company (股份有限公司)" },
          { value: "Partnership", label: "Partnership (合伙企业)" },
          { value: "Sole Proprietorship", label: "Sole Proprietorship (个人独资企业)" },
        ],
      },
    ],
  },
  {
    country: "Germany",
    countryCode: "DE",
    fields: [
      {
        name: "handelsregisternummer",
        label: "Handelsregisternummer (Commercial Register Number)",
        type: "text",
        placeholder: "Enter your HRB number (e.g., HRB 12345 B)",
        required: true,
        documentType: "incorporation_certificate",
        documentLabel: "Handelsregisterauszug (Commercial Register Extract)",
      },
      {
        name: "ustId",
        label: "Umsatzsteuer-ID (VAT ID)",
        type: "text",
        placeholder: "Enter your VAT ID (e.g., DE123456789)",
        required: true,
        documentType: "tax_certificate",
        documentLabel: "VAT Certificate",
      },
      {
        name: "businessType",
        label: "Business Type",
        type: "select",
        required: true,
        options: [
          { value: "GmbH", label: "GmbH (Gesellschaft mit beschränkter Haftung)" },
          { value: "AG", label: "AG (Aktiengesellschaft)" },
          { value: "UG", label: "UG (Unternehmergesellschaft)" },
          { value: "Partnership", label: "Partnership (Personengesellschaft)" },
          { value: "Sole Proprietorship", label: "Sole Proprietorship (Einzelunternehmen)" },
        ],
      },
    ],
  },
  {
    country: "United Kingdom",
    countryCode: "GB",
    fields: [
      {
        name: "companiesHouseNumber",
        label: "Companies House Number",
        type: "text",
        placeholder: "Enter your Companies House number (e.g., 12345678)",
        required: true,
        documentType: "incorporation_certificate",
        documentLabel: "Certificate of Incorporation",
      },
      {
        name: "vatNumber",
        label: "VAT Registration Number",
        type: "text",
        placeholder: "Enter your VAT number (e.g., GB123456789)",
        required: false,
        documentType: "tax_certificate",
        documentLabel: "VAT Registration Certificate",
      },
      {
        name: "utr",
        label: "Unique Taxpayer Reference (UTR)",
        type: "text",
        placeholder: "Enter your UTR (10 digits)",
        required: true,
        documentType: "tax_certificate",
        documentLabel: "Tax Registration Certificate",
      },
      {
        name: "businessType",
        label: "Business Type",
        type: "select",
        required: true,
        options: [
          { value: "Limited Company", label: "Limited Company (Ltd)" },
          { value: "Public Limited Company", label: "Public Limited Company (PLC)" },
          { value: "LLP", label: "Limited Liability Partnership (LLP)" },
          { value: "Partnership", label: "Partnership" },
          { value: "Sole Trader", label: "Sole Trader" },
        ],
      },
    ],
  },
  {
    country: "France",
    countryCode: "FR",
    fields: [
      {
        name: "siret",
        label: "SIRET Number",
        type: "text",
        placeholder: "Enter your SIRET number (14 digits)",
        required: true,
        documentType: "business_license",
        documentLabel: "Extrait K-bis (Business Registration Certificate)",
      },
      {
        name: "siren",
        label: "SIREN Number",
        type: "text",
        placeholder: "Enter your SIREN number (9 digits)",
        required: true,
      },
      {
        name: "tva",
        label: "TVA Number (VAT)",
        type: "text",
        placeholder: "Enter your TVA number (e.g., FR12345678901)",
        required: false,
        documentType: "tax_certificate",
        documentLabel: "TVA Certificate",
      },
      {
        name: "businessType",
        label: "Business Type",
        type: "select",
        required: true,
        options: [
          { value: "SARL", label: "SARL (Société à Responsabilité Limitée)" },
          { value: "SA", label: "SA (Société Anonyme)" },
          { value: "SAS", label: "SAS (Société par Actions Simplifiée)" },
          { value: "EURL", label: "EURL (Entreprise Unipersonnelle à Responsabilité Limitée)" },
          { value: "Partnership", label: "Partnership (Société en Nom Collectif)" },
        ],
      },
    ],
  },
  {
    country: "Canada",
    countryCode: "CA",
    fields: [
      {
        name: "businessNumber",
        label: "Business Number (BN)",
        type: "text",
        placeholder: "Enter your Business Number (9 digits)",
        required: true,
        documentType: "business_license",
        documentLabel: "Business Registration Certificate",
      },
      {
        name: "corporationNumber",
        label: "Corporation Number",
        type: "text",
        placeholder: "Enter your Corporation Number",
        required: false,
        documentType: "incorporation_certificate",
        documentLabel: "Certificate of Incorporation",
      },
      {
        name: "gstHstNumber",
        label: "GST/HST Number",
        type: "text",
        placeholder: "Enter your GST/HST number",
        required: false,
        documentType: "tax_certificate",
        documentLabel: "GST/HST Registration Certificate",
      },
      {
        name: "provinceOfIncorporation",
        label: "Province of Incorporation",
        type: "select",
        required: true,
        placeholder: "Select province",
      },
      {
        name: "businessType",
        label: "Business Type",
        type: "select",
        required: true,
        options: [
          { value: "Corporation", label: "Corporation" },
          { value: "LLC", label: "Limited Liability Company" },
          { value: "Partnership", label: "Partnership" },
          { value: "Sole Proprietorship", label: "Sole Proprietorship" },
          { value: "Cooperative", label: "Cooperative" },
        ],
      },
    ],
  },
  {
    country: "Australia",
    countryCode: "AU",
    fields: [
      {
        name: "acn",
        label: "Australian Company Number (ACN)",
        type: "text",
        placeholder: "Enter your ACN (9 digits)",
        required: true,
        documentType: "incorporation_certificate",
        documentLabel: "Certificate of Incorporation",
      },
      {
        name: "abn",
        label: "Australian Business Number (ABN)",
        type: "text",
        placeholder: "Enter your ABN (11 digits)",
        required: true,
        documentType: "business_license",
        documentLabel: "ABN Registration Certificate",
      },
      {
        name: "tfn",
        label: "Tax File Number (TFN)",
        type: "text",
        placeholder: "Enter your TFN",
        required: false,
        documentType: "tax_certificate",
        documentLabel: "Tax Registration Certificate",
      },
      {
        name: "stateOfIncorporation",
        label: "State/Territory of Incorporation",
        type: "select",
        required: true,
        placeholder: "Select state/territory",
      },
      {
        name: "businessType",
        label: "Business Type",
        type: "select",
        required: true,
        options: [
          { value: "Proprietary Limited", label: "Proprietary Limited (Pty Ltd)" },
          { value: "Public Company", label: "Public Company Limited" },
          { value: "LLP", label: "Limited Liability Partnership" },
          { value: "Partnership", label: "Partnership" },
          { value: "Sole Trader", label: "Sole Trader" },
        ],
      },
    ],
  },
  {
    country: "United Arab Emirates",
    countryCode: "AE",
    fields: [
      {
        name: "tradeLicenseNumber",
        label: "Trade License Number",
        type: "text",
        placeholder: "Enter your Trade License Number",
        required: true,
        documentType: "business_license",
        documentLabel: "Trade License",
      },
      {
        name: "emiratesId",
        label: "Emirates ID (for authorized signatory)",
        type: "text",
        placeholder: "Enter Emirates ID",
        required: true,
        documentType: "other",
        documentLabel: "Emirates ID Copy",
      },
      {
        name: "taxRegistrationNumber",
        label: "Tax Registration Number (TRN)",
        type: "text",
        placeholder: "Enter your TRN",
        required: false,
        documentType: "tax_certificate",
        documentLabel: "Tax Registration Certificate",
      },
      {
        name: "emirate",
        label: "Emirate",
        type: "select",
        required: true,
        options: [
          { value: "Dubai", label: "Dubai" },
          { value: "Abu Dhabi", label: "Abu Dhabi" },
          { value: "Sharjah", label: "Sharjah" },
          { value: "Ajman", label: "Ajman" },
          { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
          { value: "Fujairah", label: "Fujairah" },
          { value: "Umm Al Quwain", label: "Umm Al Quwain" },
        ],
      },
      {
        name: "businessType",
        label: "Business Type",
        type: "select",
        required: true,
        options: [
          { value: "LLC", label: "Limited Liability Company (LLC)" },
          { value: "Public Joint Stock Company", label: "Public Joint Stock Company (PJSC)" },
          { value: "Private Joint Stock Company", label: "Private Joint Stock Company (PJSC)" },
          { value: "Partnership", label: "Partnership" },
          { value: "Sole Establishment", label: "Sole Establishment" },
        ],
      },
    ],
  },
];

const seedCountryBusinessFields = async () => {
  try {
    // Check if model is connected
    const dbState = CountryBusinessFields.db.readyState;
    if (dbState !== 1) {
      throw new Error(`Database not connected. ReadyState: ${dbState}`);
    }

    console.log(`📊 Database: ${CountryBusinessFields.db.databaseName}`);
    console.log(`📊 Collection: ${CountryBusinessFields.collection.name}`);

    // Check current count
    const beforeCount = await CountryBusinessFields.countDocuments();
    console.log(`📊 Current documents in collection: ${beforeCount}`);

    // Clear existing data to ensure fresh seed
    await CountryBusinessFields.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Insert seed data
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const countryData of countryFieldsData) {
      try {
        const existing = await CountryBusinessFields.findOne({ country: countryData.country });
        if (!existing) {
          const result = await CountryBusinessFields.create(countryData);
          console.log(`✓ Seeded business fields for ${countryData.country} (ID: ${result._id})`);
          created++;
        } else {
          console.log(`⚠ ${countryData.country} already exists (ID: ${existing._id}), skipping...`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error seeding ${countryData.country}:`, error.message);
        errors++;
      }
    }

    // Check final count
    const afterCount = await CountryBusinessFields.countDocuments();
    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total documents: ${afterCount}`);
    console.log("✓ Country business fields seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding country business fields:", error);
    throw error;
  }
};

module.exports = { seedCountryBusinessFields, countryFieldsData };
