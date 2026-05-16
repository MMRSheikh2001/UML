import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { AuthService } from '../../../services/auth';
import { JobService } from '../../../services/job';
import { JobApplicationService } from '../../../services/job-application';
import { HiringPipelineService } from '../../../services/hiring-pipeline';
import { InterviewRoundService } from '../../../services/interview-round';
import { Job } from '../../../models/job';
import { JobApplication } from '../../../models/job-application';
import { HiringPipeline } from '../../../models/hiring-pipeline';
import { InterviewRound } from '../../../models/interview-round';

@Component({
  selector: 'app-jobs-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, Sidebar],
  templateUrl: './jobs-management.html',
  styleUrl: './jobs-management.css'
})
export class JobsManagement implements OnInit {

  activeTab = 'applied';
  loading = true;

  // Applied jobs (job seeker view)
  appliedJobs: JobApplication[] = [];

  // Posted jobs (employer view)
  postedJobs: Job[] = [];
  showPostForm = false;
  postForm: FormGroup;
  posting = false;
  postSuccess = false;

  // Pipeline
  pipeline: HiringPipeline[] = [];
  pipelineStages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

  // Interviews
  interviews: InterviewRound[] = [];

  userId: string | number = '';

  jobTypes = ['full-time', 'part-time', 'remote', 'contract'];
  cities = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna'];

  constructor(
    private auth: AuthService,
    private jobService: JobService,
    private jobAppService: JobApplicationService,
    private pipelineService: HiringPipelineService,
    private interviewService: InterviewRoundService,
    private fb: FormBuilder
  ) {
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      companyName: ['', Validators.required],
      city: ['', Validators.required],
      area: [''],
      jobType: ['full-time', Validators.required],
      salaryMin: [0, Validators.min(0)],
      salaryMax: [0, Validators.min(0)],
      experienceRequired: [''],
      description: ['', Validators.required],
      deadline: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const userId = this.auth.getCurrentUserId();
    if (!userId) {
      this.loading = false;
      return;
    }
    this.userId = userId;
    this.loadAll();
  }

  loadAll(): void {
    this.loadApplied();
    this.loadPosted();
    this.loadPipeline();
    this.loadInterviews();
  }

  loadApplied(): void {
    const t = setTimeout(() => { this.loading = false; }, 5000);
    this.jobAppService.findByApplicantId(this.userId).subscribe({
      next: (apps) => { clearTimeout(t); this.appliedJobs = apps; this.loading = false; },
      error: () => { clearTimeout(t); this.loading = false; }
    });
  }

  loadPosted(): void {
    this.jobService.findByEmployerId(this.userId).subscribe({
      next: (jobs) => this.postedJobs = jobs
    });
  }

  loadPipeline(): void {
    this.pipelineService.findByApplicantId(this.userId).subscribe({
      next: (p) => this.pipeline = p
    });
  }

  loadInterviews(): void {
    this.interviewService.findByApplicantId(this.userId).subscribe({
      next: (r) => this.interviews = r
    });
  }

  getJobsByStage(stage: string): HiringPipeline[] {
    return this.pipeline.filter(p => p.stage === stage);
  }

  submitJob(): void {
    if (this.postForm.invalid) return;
    this.posting = true;
    const v = this.postForm.value;

    const job: Job = {
      ...v,
      employerId: this.userId,
      companyLogo: '',
      status: 'open',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      publishedDate: new Date().toISOString(),
      vacancyCount: 1,
      workplaceType: 'onsite',
      division: v.city,
      district: v.city,
      fullAddress: v.area,
      industry: '',
      educationLevel: '',
      preferredUniversities: [],
      experienceYearsMin: 0,
      experienceYearsMax: 5,
      preferredIndustries: [],
      requiredSkills: [],
      softSkills: [],
      languageRequirements: '',
      responsibilities: [],
      dailyTasks: [],
      kpis: [],
      benefits: [],
      salaryNegotiable: true,
      festivalBonus: false,
      mobileAllowance: false,
      medicalAllowance: false,
      lunchFacility: false,
      performanceBonus: false,
      flexibleHours: false,
      workFromHome: false,
      genderPreference: 'Any',
      isUrgent: false,
      isFeatured: false,
      tags: [],
      viewCount: 0,
      applicantsCount: 0,
      companyInfo: {
        website: '', industry: '', companySize: '',
        foundedYear: 0, overview: '', linkedinUrl: '',
        facebookUrl: '', isVerified: false, officeImages: []
      },
      teamEnvironment: '',
      growthOpportunity: '',
    };

    this.jobService.save(job).subscribe({
      next: (saved) => {
        this.postedJobs.unshift(saved);
        this.posting = false;
        this.postSuccess = true;
        this.showPostForm = false;
        this.postForm.reset({ jobType: 'full-time', salaryMin: 0, salaryMax: 0 });
        setTimeout(() => this.postSuccess = false, 3000);
      },
      error: () => { this.posting = false; }
    });
  }

  closeJob(job: Job): void {
    if (!job.id) return;
    this.jobService.update(job.id, { ...job, status: 'closed' }).subscribe({
      next: () => job.status = 'closed'
    });
  }

  withdrawApplication(app: JobApplication): void {
    if (!app.id || !confirm('Withdraw this application?')) return;
    this.jobAppService.delete(app.id).subscribe({
      next: () => {
        this.appliedJobs = this.appliedJobs.filter(a => a.id !== app.id);
      }
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'pending': 'bg-warning text-dark',
      'reviewed': 'bg-info text-dark',
      'shortlisted': 'bg-primary',
      'hired': 'bg-success',
      'rejected': 'bg-danger',
      'open': 'bg-success',
      'closed': 'bg-secondary',
      'paused': 'bg-warning text-dark',
      'scheduled': 'bg-primary',
      'completed': 'bg-success',
      'cancelled': 'bg-danger',
    };
    return map[status] || 'bg-secondary';
  }

  getInterviewTypeIcon(type: string): string {
    const map: Record<string, string> = {
      'phone': 'bi-telephone', 'video': 'bi-camera-video',
      'onsite': 'bi-building', 'technical': 'bi-code-slash'
    };
    return map[type] || 'bi-calendar';
  }

  getStageBadgeColor(stage: string): string {
    const map: Record<string, string> = {
      'applied': 'bg-secondary', 'screening': 'bg-info text-dark',
      'interview': 'bg-primary', 'offer': 'bg-warning text-dark',
      'hired': 'bg-success', 'rejected': 'bg-danger'
    };
    return map[stage] || 'bg-secondary';
  }
}