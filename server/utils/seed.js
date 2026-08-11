/**
 * Development seed script.
 *
 *   npm run seed            insert sample data alongside whatever exists
 *   npm run seed -- --reset wipe every STVDIO° collection first
 *
 * Its real purpose in Phase 2 is to prove the schemas work together: every
 * document below is written through Mongoose, so validators, enums, indexes
 * and references are all exercised for real.
 *
 * Passwords are hashed by the User model's pre-save hook, so the accounts
 * below are real, working logins. The shared password is a well-known
 * development credential — it must never be used anywhere real.
 */

require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const { connectDB, disconnectDB } = require("../config/db");
const models = require("../models");
const {
  USER_ROLES,
  PROJECT_VISIBILITY,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_PROVIDERS,
  COLLABORATION_STATUS,
  APPLICATION_STATUS,
  NOTIFICATION_TYPES,
  NOTIFICATION_TARGETS,
} = require("./constants");

/**
 * Development-only credential, shared by every seeded account so the API is
 * easy to test. Hashed with bcrypt on save like any other password.
 */
const DEV_PASSWORD = "Password123!";
const shouldReset = process.argv.includes("--reset");

/** ₦ to kobo. Money is stored in the minor unit — see Service.price. */
const naira = (amount) => amount * 100;

const resetCollections = async () => {
  const names = Object.keys(models);
  await Promise.all(Object.values(models).map((Model) => Model.deleteMany({})));
  console.log(`Cleared ${names.length} collections.`);
};

const seedUsers = () =>
  models.User.create([
    {
      name: "Ada Okonkwo",
      username: "adaokonkwo",
      email: "ada@example.com",
      password: DEV_PASSWORD,
      role: USER_ROLES.CREATIVE,
      bio: "Photographer working between Lagos and Accra. Editorial, portrait, campaign.",
      location: "Lagos, Nigeria",
      skills: ["Photography", "Retouching", "Art direction"],
      categories: ["PHOTOGRAPHY", "CREATIVE_DIRECTION"],
      socialLinks: { instagram: "https://instagram.com/adaokonkwo" },
      avatar: image("woman"),
      isVerified: true,
    },
    {
      name: "Tunde Bakare",
      username: "tundeb",
      email: "tunde@example.com",
      password: DEV_PASSWORD,
      role: USER_ROLES.CREATIVE,
      bio: "Graphic designer and type nerd. Identity systems for music and fashion.",
      location: "Abuja, Nigeria",
      skills: ["Brand identity", "Typography", "Editorial design"],
      avatar: image("sample"),
      categories: ["GRAPHIC_DESIGN", "BRANDING"],
    },
    {
      name: "Mono Studio",
      username: "monostudio",
      email: "hello@monostudio.example.com",
      password: DEV_PASSWORD,
      role: USER_ROLES.BRAND,
      bio: "Independent fashion label. We commission photographers and stylists.",
      avatar: image("balloons"),
      location: "Lagos, Nigeria",
      categories: ["BRANDING"],
    },
    {
      name: "STVDIO Admin",
      username: "stvdio_admin",
      email: "admin@stvdio.example.com",
      password: DEV_PASSWORD,
      role: USER_ROLES.ADMIN,
    },
  ]);

/**
 * Development media.
 *
 * These are real, permanently hosted assets on Cloudinary's public `demo`
 * account. An earlier version of this seed invented asset names such as
 * "harmattan-01", which returned 404 and left every card blank — the URL
 * pattern was right but the assets did not exist.
 *
 * `publicId` is the asset's actual Cloudinary public id, so it stays truthful
 * once real uploads arrive in the Cloudinary phase. No width/height: they
 * would be guesses about files we do not own.
 */
const image = (publicId) => ({
  url: `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`,
  publicId,
  resourceType: "image",
});

const run = async () => {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed: NODE_ENV is production.");
    process.exit(1);
  }

  await connectDB();
  console.log(`Seeding database "${mongoose.connection.name}".`);

  if (shouldReset) {
    await resetCollections();
  }

  const [ada, tunde, mono, admin] = await seedUsers();

  // --- Projects -----------------------------------------------------------
  const [campaign, identity] = await models.Project.create([
    {
      title: "Harmattan — Editorial Series",
      description: "A six-frame series shot on the outskirts of Lagos at dawn.",
      media: [image("woman"), image("lady")],
      category: "PHOTOGRAPHY",
      tags: ["Editorial", "Fashion", "Lagos"],
      tools: ["Hasselblad 500CM", "Capture One", "Photoshop"],
      projectUrl: "https://example.com/harmattan",
      owner: ada._id,
      collaborators: [tunde._id],
      visibility: PROJECT_VISIBILITY.PUBLIC,
    },
    {
      title: "Mono — Identity System",
      description: "Wordmark, type scale and packaging for an independent label.",
      media: [image("coffee_cup")],
      category: "BRANDING",
      tags: ["Identity", "Typography"],
      tools: ["Illustrator", "Glyphs", "InDesign"],
      projectUrl: "https://example.com/mono-identity",
      owner: tunde._id,
      visibility: PROJECT_VISIBILITY.PUBLIC,
    },
    {
      // Private, so the visibility rules are demonstrable straight after seeding:
      // visible on Ada's own profile, absent from her public one.
      title: "Unreleased — SS26 Test Shoot",
      description: "Work in progress. Not for publication until the drop.",
      media: [image("couple")],
      category: "PHOTOGRAPHY",
      tags: ["Unreleased"],
      tools: ["Hasselblad 500CM"],
      owner: ada._id,
      visibility: PROJECT_VISIBILITY.PRIVATE,
    },
  ]);

  // --- Social graph -------------------------------------------------------
  await models.Follow.create([
    { follower: mono._id, following: ada._id },
    { follower: tunde._id, following: ada._id },
    { follower: ada._id, following: tunde._id },
  ]);

  await models.Like.create([
    { user: mono._id, project: campaign._id },
    { user: tunde._id, project: campaign._id },
    { user: ada._id, project: identity._id },
  ]);

  const comment = await models.Comment.create({
    user: mono._id,
    project: campaign._id,
    content: "The light in the third frame is unreal. Are you free in March?",
  });

  // --- Marketplace --------------------------------------------------------
  const shoot = await models.Service.create({
    title: "Half-Day Editorial Shoot",
    description:
      "Four hours, one location, up to three looks. Includes 15 retouched images.",
    creator: ada._id,
    category: "PHOTOGRAPHY",
    price: naira(180_000),
    currency: "NGN",
    deliveryTime: 7,
    deliverables: ["15 retouched images", "Full unedited gallery", "Usage rights"],
    media: [image("balloons")],
  });

  const order = await models.Order.create({
    client: mono._id,
    creative: ada._id,
    service: shoot._id,
    serviceSnapshot: {
      title: shoot.title,
      price: shoot.price,
      currency: shoot.currency,
      deliveryTime: shoot.deliveryTime,
    },
    amount: shoot.price,
    currency: shoot.currency,
    status: ORDER_STATUS.COMPLETED,
    paymentStatus: PAYMENT_STATUS.PAID,
    paystackReference: `stvdio_seed_${Date.now()}`,
    paidAt: new Date(),
    requirements: "Lookbook for the SS26 drop. Studio in Ikoyi.",
    completedAt: new Date(),
  });

  await models.Payment.create({
    order: order._id,
    user: mono._id,
    amount: order.amount,
    currency: order.currency,
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    reference: order.paystackReference,
    status: PAYMENT_STATUS.PAID,
    paidAt: order.paidAt,
    metadata: { seeded: true },
  });

  const review = await models.Review.create({
    order: order._id,
    reviewer: mono._id,
    creative: ada._id,
    service: shoot._id,
    rating: 5,
    comment: "Turned the shoot around in four days. Would book again.",
  });

  // --- Collaboration ------------------------------------------------------
  const collaboration = await models.Collaboration.create({
    creator: mono._id,
    title: "Photographer for a Lagos fashion campaign",
    description:
      "Two-day shoot in November. Looking for someone with editorial experience.",
    category: "PHOTOGRAPHY",
    location: "Lagos, Nigeria",
    budget: { min: naira(200_000), max: naira(450_000), currency: "NGN" },
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: COLLABORATION_STATUS.OPEN,
    applicationsCount: 1,
  });

  await models.CollaborationApplication.create({
    collaboration: collaboration._id,
    applicant: ada._id,
    message: "I shot the Harmattan series in similar conditions — portfolio attached.",
    portfolioProjects: [campaign._id],
    status: APPLICATION_STATUS.PENDING,
  });

  // --- Messaging ----------------------------------------------------------
  const conversation = await models.Conversation.create({
    participants: [mono._id, ada._id],
  });

  const [, secondMessage] = await models.Message.create([
    {
      conversation: conversation._id,
      sender: mono._id,
      content: "Hi Ada — are you available the second week of November?",
      read: true,
      readAt: new Date(),
    },
    {
      conversation: conversation._id,
      sender: ada._id,
      content: "I am. Send the moodboard and I'll quote by Friday.",
    },
  ]);

  conversation.lastMessage = secondMessage._id;
  conversation.lastMessageAt = secondMessage.createdAt;
  conversation.unreadCounts = new Map([[mono._id.toString(), 1]]);
  await conversation.save();

  // --- Notifications ------------------------------------------------------
  await models.Notification.create([
    {
      recipient: ada._id,
      actor: mono._id,
      type: NOTIFICATION_TYPES.PROJECT_LIKED,
      message: "Mono Studio liked Harmattan — Editorial Series",
      relatedId: campaign._id,
      relatedModel: NOTIFICATION_TARGETS.PROJECT,
    },
    {
      recipient: ada._id,
      actor: mono._id,
      type: NOTIFICATION_TYPES.ORDER_RECEIVED,
      message: "You have a new order for Half-Day Editorial Shoot",
      relatedId: order._id,
      relatedModel: NOTIFICATION_TARGETS.ORDER,
    },
  ]);

  // --- Counters -----------------------------------------------------------
  // Kept in step with the collections above. From Phase 5 the controllers that
  // create likes and follows will own this.
  await models.Project.updateOne(
    { _id: campaign._id },
    { likesCount: 2, commentsCount: 1 },
  );
  await models.Project.updateOne({ _id: identity._id }, { likesCount: 1 });
  await models.User.updateOne(
    { _id: ada._id },
    {
      followersCount: 2,
      followingCount: 1,
      projectsCount: 2,
      rating: review.rating,
      reviewsCount: 1,
    },
  );
  await models.User.updateOne(
    { _id: tunde._id },
    { followersCount: 1, followingCount: 1, projectsCount: 1 },
  );
  await models.User.updateOne({ _id: mono._id }, { followingCount: 1 });
  await models.Service.updateOne(
    { _id: shoot._id },
    { ordersCount: 1, rating: review.rating, reviewsCount: 1 },
  );

  // --- Summary ------------------------------------------------------------
  const counts = {};
  for (const [name, Model] of Object.entries(models)) {
    counts[name] = await Model.countDocuments();
  }
  console.table(counts);

  console.log(`\nSeeded logins (${admin ? 4 : 0} accounts):`);
  console.log("  ada@example.com                CREATIVE");
  console.log("  tunde@example.com              CREATIVE");
  console.log("  hello@monostudio.example.com   BRAND");
  console.log("  admin@stvdio.example.com       ADMIN");
  console.log(`\n  Password for all four: ${DEV_PASSWORD}`);
  console.log(
    "\n! Development credentials only — never reuse this password anywhere real.",
  );
  console.log("! Stored as bcrypt hashes via the User model's pre-save hook.");
  console.log("! Comment id for reference:", comment._id.toString());
};

run()
  .then(async () => {
    await disconnectDB();
    console.log("\nSeed complete.");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`\nSeed failed: ${error.message}`);
    if (error.code === 11000) {
      console.error("Duplicate key — run with --reset to clear existing data.");
    }
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
