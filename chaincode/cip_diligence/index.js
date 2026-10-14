"use strict";

const { Contract } = require("fabric-contract-api");

class CIPDiligence extends Contract {
  _getMSP(ctx) {
    return ctx.clientIdentity.getMSPID();
  }

  _getTxTime(ctx) {
    const timestamp = ctx.stub.getTxTimestamp();
    const seconds = Number(timestamp.seconds);

    return new Date(seconds * 1000).toISOString();
  }

  async applyStartup(ctx, id, name, country, founder, email) {
    if (!id || !name || !country || !founder || !email) {
      throw new Error("All startup fields are required");
    }

    const existing = await ctx.stub.getState(id);

    if (existing && existing.length > 0) {
      throw new Error(`Startup ${id} already exists`);
    }

    const startup = {
      id,
      name,
      country,
      founder,
      email,
      status: "NOT_VALIDATED",
      verificationStatus: "PENDING",
      validators: [],
      validatorReports: [],
      investorQueries: [],
      investmentPlans: [],
      milestones: [],
      releasedFunds: 0,
      createdAt: this._getTxTime(ctx),
    };

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(startup)));

    return `Startup ${id} registered successfully`;
  }

  async getStartup(ctx, startupId) {
    return await this._readStartup(ctx, startupId);
  }

  async assignValidators(ctx, startupId, validatorsJson) {
    if (this._getMSP(ctx) !== "Org1MSP") {
      throw new Error("Only the platform can assign validators");
    }

    const startup = await this._readStartup(ctx, startupId);
    const validators = JSON.parse(validatorsJson);

    if (!Array.isArray(validators) || validators.length === 0) {
      throw new Error("At least one validator is required");
    }

    if (validators.some((v) => typeof v !== "string" || !v.trim())) {
      throw new Error("Validator names must be non-empty strings");
    }

    startup.validators = [...new Set(validators)];
    startup.verificationStatus = "PENDING";

    await ctx.stub.putState(startupId, Buffer.from(JSON.stringify(startup)));

    return `Validators assigned to startup ${startupId}`;
  }

  async submitValidatorReport(ctx, startupId, validatorName, report, decision) {
    if (this._getMSP(ctx) !== "Org2MSP") {
      throw new Error("Only validators can submit reports");
    }

    const startup = await this._readStartup(ctx, startupId);

    if (!startup.validators.includes(validatorName)) {
      throw new Error("Validator is not assigned to this startup");
    }

    if (!report || !["APPROVE", "REJECT"].includes(decision)) {
      throw new Error("A report and valid decision are required");
    }

    const existing = startup.validatorReports.find(
      (item) => item.validatorName === validatorName,
    );

    if (existing) {
      throw new Error("This validator has already submitted a report");
    }

    startup.validatorReports.push({
      validatorName,
      report,
      decision,
      submittedAt: this._getTxTime(ctx),
    });

    const requiredReports = startup.validators.length;
    const submittedReports = startup.validatorReports.length;

    if (submittedReports === requiredReports) {
      startup.verificationStatus = startup.validatorReports.every(
        (item) => item.decision === "APPROVE",
      )
        ? "VERIFIED"
        : "REJECTED";
    }

    await ctx.stub.putState(startupId, Buffer.from(JSON.stringify(startup)));

    return `Validator report recorded for startup ${startupId}`;
  }

  async getVerifiedStartups(ctx) {
    const iterator = await ctx.stub.getStateByRange("", "");
    const results = [];

    try {
      let item = await iterator.next();

      while (!item.done) {
        const value = item.value.value.toString("utf8");

        if (value) {
          const record = JSON.parse(value);

          if (record.verificationStatus === "VERIFIED") {
            results.push(record);
          }
        }

        item = await iterator.next();
      }
    } finally {
      await iterator.close();
    }

    return results;
  }

  async submitInvestorQuery(ctx, startupId, question) {
    if (this._getMSP(ctx) !== "Org2MSP") {
      throw new Error("Only investors can submit queries");
    }

    if (!question || !question.trim()) {
      throw new Error("Question is required");
    }

    const startup = await this._readStartup(ctx, startupId);

    if (startup.verificationStatus !== "VERIFIED") {
      throw new Error("Investors can query only verified startups");
    }

    startup.investorQueries.push({
      question: question.trim(),
      answers: [],
      askedAt: this._getTxTime(ctx),
    });

    await ctx.stub.putState(startupId, Buffer.from(JSON.stringify(startup)));

    return `Investor query submitted for startup ${startupId}`;
  }

  async answerInvestorQuery(ctx, startupId, queryIndex, answer) {
    if (this._getMSP(ctx) !== "Org2MSP") {
      throw new Error("Only validators can answer queries");
    }

    if (!answer || !answer.trim()) {
      throw new Error("Answer is required");
    }

    const startup = await this._readStartup(ctx, startupId);
    const index = Number(queryIndex);

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= startup.investorQueries.length
    ) {
      throw new Error("Invalid investor query index");
    }

    startup.investorQueries[index].answers.push({
      validator: this._getMSP(ctx),
      answer: answer.trim(),
      time: this._getTxTime(ctx),
    });

    await ctx.stub.putState(startupId, Buffer.from(JSON.stringify(startup)));

    return `Investor query ${index} answered for startup ${startupId}`;
  }

  async proposeInvestment(ctx, startupId, amount) {
    if (this._getMSP(ctx) !== "Org2MSP") {
      throw new Error("Only investors can propose investments");
    }

    const investmentAmount = Number(amount);

    if (!Number.isSafeInteger(investmentAmount) || investmentAmount <= 0) {
      throw new Error("Investment amount must be a positive safe integer");
    }

    const startup = await this._readStartup(ctx, startupId);

    if (startup.verificationStatus !== "VERIFIED") {
      throw new Error("Investment can be proposed only for verified startups");
    }

    startup.investmentPlans.push({
      investor: this._getMSP(ctx),
      amount: investmentAmount,
      status: "PENDING",
      proposedAt: this._getTxTime(ctx),
      respondedAt: null,
    });

    await ctx.stub.putState(startupId, Buffer.from(JSON.stringify(startup)));

    return `Investment proposal submitted for startup ${startupId}`;
  }

  async respondToInvestment(ctx, startupId, planIndex, response) {
    if (this._getMSP(ctx) !== "Org1MSP") {
      throw new Error("Only the platform can respond to investments");
    }

    if (!["ACCEPTED", "REJECTED"].includes(response)) {
      throw new Error("Response must be ACCEPTED or REJECTED");
    }

    const startup = await this._readStartup(ctx, startupId);
    const index = Number(planIndex);

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= startup.investmentPlans.length
    ) {
      throw new Error("Invalid investment plan index");
    }

    const plan = startup.investmentPlans[index];

    if (plan.status !== "PENDING") {
      throw new Error("Investment proposal has already been answered");
    }

    plan.status = response;
    plan.respondedAt = this._getTxTime(ctx);

    await ctx.stub.putState(startupId, Buffer.from(JSON.stringify(startup)));

    return `Investment proposal ${response.toLowerCase()} for startup ${startupId}`;
  }

  async createMilestone(ctx, startupId, milestoneId, title, amount) {
    if (this._getMSP(ctx) !== "Org1MSP") {
      throw new Error("Only the platform can create milestones");
    }

    if (!milestoneId || !title || !title.trim()) {
      throw new Error("Milestone ID and title are required");
    }

    const milestoneAmount = Number(amount);

    if (!Number.isSafeInteger(milestoneAmount) || milestoneAmount <= 0) {
      throw new Error("Milestone amount must be a positive safe integer");
    }

    const startup = await this._readStartup(ctx, startupId);

    if (startup.verificationStatus !== "VERIFIED") {
      throw new Error("Milestones can be created only for verified startups");
    }

    if (startup.milestones.some((item) => item.id === milestoneId)) {
      throw new Error(`Milestone ${milestoneId} already exists`);
    }

    startup.milestones.push({
      id: milestoneId,
      title: title.trim(),
      amount: milestoneAmount,
      status: "PENDING",
      createdAt: this._getTxTime(ctx),
      verifiedAt: null,
      paidAt: null,
    });

    await ctx.stub.putState(startupId, Buffer.from(JSON.stringify(startup)));

    return `Milestone ${milestoneId} created for startup ${startupId}`;
  }

  async verifyMilestone(ctx, startupId, milestoneId) {
    if (this._getMSP(ctx) !== "Org2MSP") {
      throw new Error("Only validators can verify milestones");
    }

    const startup = await this._readStartup(ctx, startupId);

    const milestone = startup.milestones.find(
      (item) => item.id === milestoneId,
    );

    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    if (milestone.status !== "PENDING") {
      throw new Error("Only pending milestones can be verified");
    }

    milestone.status = "VERIFIED";
    milestone.verifiedAt = this._getTxTime(ctx);

    await ctx.stub.putState(startupId, Buffer.from(JSON.stringify(startup)));

    return `Milestone ${milestoneId} verified`;
  }

  async releaseFunds(ctx, startupId, milestoneId) {
    if (this._getMSP(ctx) !== "Org2MSP") {
      throw new Error("Only investors can release milestone funds");
    }

    const startup = await this._readStartup(ctx, startupId);

    const milestone = startup.milestones.find(
      (item) => item.id === milestoneId,
    );

    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    if (milestone.status === "PAID") {
      throw new Error("Funds have already been released for this milestone");
    }

    if (milestone.status !== "VERIFIED") {
      throw new Error("Milestone must be verified before funds are released");
    }

    const updatedReleasedFunds = startup.releasedFunds + milestone.amount;

    if (!Number.isSafeInteger(updatedReleasedFunds)) {
      throw new Error("Total released funds exceed the safe integer range");
    }

    milestone.status = "PAID";
    milestone.paidAt = this._getTxTime(ctx);
    startup.releasedFunds = updatedReleasedFunds;

    await ctx.stub.putState(startupId, Buffer.from(JSON.stringify(startup)));

    return `Funds recorded as released for milestone ${milestoneId}`;
  }

  async _readStartup(ctx, startupId) {
    const bytes = await ctx.stub.getState(startupId);

    if (!bytes || bytes.length === 0) {
      throw new Error(`Startup ${startupId} not found`);
    }

    return JSON.parse(bytes.toString("utf8"));
  }
}

module.exports.contracts = [CIPDiligence];
