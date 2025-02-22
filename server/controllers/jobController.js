import Job from "../models/JobModel.js";
import sendMail from "../utils/emailService.js";

export const createJob = async (req, res) => {
  const { title, description, experience, endDate, candidates } = req.body;
  try {
    // Check if company is verified
    if (!req.company.verified) {
      return res.status(403).json({
        message:
          "Only verified companies can create jobs. Please verify your account first.",
      });
    }

    const job = await Job.create({
      title,
      description,
      experience,
      endDate,
      company: req.company._id,
      candidates,
    });
    res.status(201).json({ job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//fetching all jobs
export const fetchJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("company", "name email phone");
    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//fetching a single job
export const fetchJob = async (req, res) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id).populate("company", "name email phone");
    res.status(200).json({ job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//updating a job
export const updateJob = async (req, res) => {
  const { id } = req.params;
  const { title, description, experience, endDate } = req.body;
  try {
    const job = await Job.findByIdAndUpdate(
      id,
      { title, description, experience, endDate },
      { new: true }
    );
    res.status(200).json({ job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//deleting a job

export const deleteJob = async (req, res) => {
  const { id } = req.params;
  try {
    await Job.findByIdAndDelete(id);
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendEmail = async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await Job.findById(jobId).populate("company", "name email");
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const emailArray = job.candidates;
    const emailErrors = [];
    for (let i = 0; i < emailArray.length; i++) {
      const receiptEmail = emailArray[i];
      try {
        await sendMail(
          receiptEmail,
          "Job Posted",
          `Hello, <br> We are pleased to inform you that new job has been posted. <br> <br> Best Regards, <br> ${job.company.email}`,
        );
      } catch (error) {
        emailErrors.push({
          email: receiptEmail,
          error: error.message
        });
      }
    }

    if (emailErrors.length > 0) {
      return res.status(500).json({
        message: "Some emails failed to send",
        errors: emailErrors
      });
    }

    return res.status(200).json({ message: "All emails sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}; 