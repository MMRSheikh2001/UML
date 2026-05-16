import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Resume } from '../models/resume';

@Injectable({ providedIn: 'root' })
export class ResumeService {

  private url = 'http://localhost:3000/resumes';

  constructor(private http: HttpClient) { }

  // ── Original 5 Methods ────────────────────────────────────────

  findAll(): Observable<Resume[]> {
    return this.http.get<Resume[]>(this.url);
  }

  getById(id: string | number): Observable<Resume> {
    return this.http.get<Resume>(`${this.url}/${id}`);
  }

  save(resume: Resume): Observable<Resume> {
    return this.http.post<Resume>(this.url, resume);
  }

  update(id: string | number, resume: Resume): Observable<Resume> {
    return this.http.put<Resume>(`${this.url}/${id}`, resume);
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  // ── Filter Methods ────────────────────────────────────────────

  findByUserId(userId: string | number): Observable<Resume[]> {
    return this.http.get<Resume[]>(`${this.url}?userId=${userId}`);
  }

  // ── Extended Methods ──────────────────────────────────────────

  saveExtendedResume(resume: Resume): Observable<Resume> {
    const withCompletion = {
      ...resume,
      profileCompletion: this.calculateProfileCompletion(resume)
    };
    if (resume.id) {
      return this.update(resume.id, withCompletion);
    }
    return this.save(withCompletion);
  }

  calculateProfileCompletion(resume: Resume): number {
    const checks: boolean[] = [
      !!resume.careerObjective,
      !!resume.resumeHeadline,
      !!resume.dateOfBirth,
      !!resume.gender,
      !!resume.presentAddress,
      !!resume.permanentAddress,
      !!resume.division,
      !!resume.district,
      resume.educations?.length > 0,
      resume.experiences?.length > 0,
      resume.skillEntries?.length > 0,
      resume.certificationList?.length > 0,
      resume.projects?.length > 0,
      !!resume.linkedinUrl,
      !!resume.githubLink,
      resume.languagesKnown?.length > 0,
      !!resume.expectedSalary,
      !!resume.careerLevel,
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }

  getMissingFields(resume: Resume): string[] {
    const missing: string[] = [];
    if (!resume.careerObjective) missing.push('Career Objective');
    if (!resume.resumeHeadline) missing.push('Resume Headline');
    if (!resume.dateOfBirth) missing.push('Date of Birth');
    if (!resume.gender) missing.push('Gender');
    if (!resume.presentAddress) missing.push('Present Address');
    if (!resume.division) missing.push('Division');
    if (!resume.district) missing.push('District');
    if (!resume.educations?.length) missing.push('Education');
    if (!resume.skillEntries?.length) missing.push('Skills');
    if (!resume.experiences?.length) missing.push('Work Experience');
    if (!resume.linkedinUrl) missing.push('LinkedIn Profile');
    if (!resume.expectedSalary) missing.push('Expected Salary');
    return missing;
  }

  getPublicProfile(userId: string | number): Observable<Resume[]> {
    return this.http.get<Resume[]>(
      `${this.url}?userId=${userId}&cvVisibility=Public`
    );
  }
  findByGithubLink(githubLink: string): Observable<Resume[]> {
    return this.http.get<Resume[]>(`${this.url}?githubLink_like=${githubLink}`);
  }
}


