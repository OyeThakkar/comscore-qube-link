// Qube Wire API service for booking management
// Based on the API documentation: https://qubewire.docs.apiary.io/

interface BookingRequest {
  content_id: string;
  package_uuid: string;
  film_id?: string;
  theatre_id?: string;
  theatre_name?: string;
  playdate_begin: string;
  playdate_end: string;
  booker_name?: string;
  booker_email?: string;
  studio_name?: string;
  delivery_method?: string;
  operation?: string;
}

interface BookingResponse {
  booking_id: string;
  status: string;
  message?: string;
}

interface DeliveryStatus {
  booking_id: string;
  content_id: string;
  package_uuid: string;
  status: 'pending' | 'shipped' | 'downloading' | 'completed' | 'cancelled' | 'failed';
  theatre_name: string;
  delivery_date?: string;
  progress?: number;
  error_message?: string;
}

class QubeWireApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    const environment = import.meta.env.VITE_QUBE_WIRE_ENVIRONMENT || 'test';
    this.baseUrl = environment === 'production' 
      ? import.meta.env.VITE_QUBE_WIRE_PROD_API_URL 
      : import.meta.env.VITE_QUBE_WIRE_TEST_API_URL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.token) {
      throw new Error('Personal Access Token (PAT) not configured. Please set your Qube Wire token.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed with status ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      if (!responseText) {
        return {} as T;
      }

      return JSON.parse(responseText);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred while making API request');
    }
  }

  // Create a booking using the v2 API
  async createBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    const payload = {
      content_id: bookingData.content_id,
      package_uuid: bookingData.package_uuid,
      film_id: bookingData.film_id,
      theatre_id: bookingData.theatre_id,
      theatre_name: bookingData.theatre_name,
      playdate_begin: bookingData.playdate_begin,
      playdate_end: bookingData.playdate_end,
      booker_name: bookingData.booker_name,
      booker_email: bookingData.booker_email,
      studio_name: bookingData.studio_name,
      delivery_method: bookingData.delivery_method || 'Digital',
      operation: bookingData.operation || 'insert'
    };

    return this.makeRequest<BookingResponse>('/v2/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Fetch booking delivery statuses using the v2 API
  async getDeliveryStatuses(contentId?: string, packageUuid?: string): Promise<DeliveryStatus[]> {
    let endpoint = '/v2/bookings/dcps';
    const params = new URLSearchParams();
    
    if (contentId) {
      params.append('content_id', contentId);
    }
    if (packageUuid) {
      params.append('package_uuid', packageUuid);
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.makeRequest<DeliveryStatus[]>(endpoint);
  }

  // Test API connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest('/health', { method: 'GET' });
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }
}

export const qubeWireApi = new QubeWireApiService();
export type { BookingRequest, BookingResponse, DeliveryStatus };