import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface CreateJobRequest {
  prompt: string
  imageUrl?: string
  durationSec: 5 | 10 | 15
  seed?: number
  cfg?: number
}

export interface CreateJobResponse {
  jobId: string
  creditsUsed: number
  creditsRemaining: number
}

export interface JobStatusResponse {
  jobId: string
  status: string
  prompt: string
  durationSec: number
  creditsUsed: number
  r2Url?: string
  expiresAt?: number
  errorMessage?: string
  createdAt: number
  updatedAt: number
}

export interface CreditsResponse {
  credits: number
  plan: string
  planDetails?: any
}

class CineWeaveAPI {
  private getAuthHeader(token: string) {
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  async initializeUser(token: string) {
    const response = await axios.post(
      `${API_URL}/users/init`,
      {},
      { headers: this.getAuthHeader(token) }
    )
    return response.data
  }

  async getCredits(token: string): Promise<CreditsResponse> {
    const response = await axios.get(
      `${API_URL}/credits`,
      { headers: this.getAuthHeader(token) }
    )
    return response.data
  }

  async createJob(token: string, request: CreateJobRequest): Promise<CreateJobResponse> {
    const response = await axios.post(
      `${API_URL}/jobs/create`,
      request,
      { headers: this.getAuthHeader(token) }
    )
    return response.data
  }

  async getJobStatus(token: string, jobId: string): Promise<JobStatusResponse> {
    const response = await axios.get(
      `${API_URL}/jobs/${jobId}`,
      { headers: this.getAuthHeader(token) }
    )
    return response.data
  }

  async listJobs(token: string, limit: number = 20) {
    const response = await axios.get(
      `${API_URL}/jobs?limit=${limit}`,
      { headers: this.getAuthHeader(token) }
    )
    return response.data
  }
}

export const api = new CineWeaveAPI()
