// Mock data for development and demo purposes

export const mockUser = {
  id: "083379b8-b64b-4977-97fd-1fe801610f29", // Valid UUID format
  email: "demo@example.com",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockOrders = [
  {
    id: "1",
    user_id: "083379b8-b64b-4977-97fd-1fe801610f29",
    content_id: "CONTENT-001",
    content_title: "Top Gun: Maverick",
    package_uuid: "PKG-UUID-001",
    film_id: "FILM-001",
    theatre_id: "THR-001",
    theatre_name: "AMC Empire 25",
    theatre_city: "New York",
    theatre_state: "NY",
    playdate_begin: "2024-02-01",
    playdate_end: "2024-02-14",
    booker_name: "John Smith",
    booker_email: "john.smith@amc.com",
    studio_name: "Paramount Pictures",
    delivery_method: "Digital",
    operation: "insert",
    booking_ref: null,
    booking_created_at: null,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    user_id: "083379b8-b64b-4977-97fd-1fe801610f29",
    content_id: "CONTENT-001",
    content_title: "Top Gun: Maverick",
    package_uuid: "PKG-UUID-001",
    film_id: "FILM-001",
    theatre_id: "THR-002",
    theatre_name: "Regal Union Square",
    theatre_city: "New York",
    theatre_state: "NY",
    playdate_begin: "2024-02-01",
    playdate_end: "2024-02-14",
    booker_name: "Sarah Johnson",
    booker_email: "sarah.j@regal.com",
    studio_name: "Paramount Pictures",
    delivery_method: "Digital",
    operation: "update",
    booking_ref: "QW-BOOK-001",
    booking_created_at: "2024-01-16T09:30:00Z",
    created_at: "2024-01-15T11:00:00Z",
    updated_at: "2024-01-16T09:30:00Z"
  },
  {
    id: "3",
    user_id: "083379b8-b64b-4977-97fd-1fe801610f29",
    content_id: "CONTENT-002",
    content_title: "Avatar: The Way of Water",
    package_uuid: "PKG-UUID-002",
    film_id: "FILM-002",
    theatre_id: "THR-003",
    theatre_name: "Cinemark Century City",
    theatre_city: "Los Angeles",
    theatre_state: "CA",
    playdate_begin: "2024-02-10",
    playdate_end: "2024-02-24",
    booker_name: "Mike Davis",
    booker_email: "mike.davis@cinemark.com",
    studio_name: "20th Century Studios",
    delivery_method: "Digital",
    operation: "insert",
    booking_ref: null,
    booking_created_at: null,
    created_at: "2024-01-20T14:00:00Z",
    updated_at: "2024-01-20T14:00:00Z"
  }
];

export const mockCplData = [
  {
    id: "1",
    user_id: "083379b8-b64b-4977-97fd-1fe801610f29",
    content_id: "CONTENT-001",
    package_uuid: "PKG-UUID-001",
    cpl_list: "CPL-001-2K-EN, CPL-001-4K-EN, CPL-001-2K-ES",
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z"
  },
  {
    id: "2",
    user_id: "083379b8-b64b-4977-97fd-1fe801610f29",
    content_id: "CONTENT-002",
    package_uuid: "PKG-UUID-002",
    cpl_list: "CPL-002-2K-EN, CPL-002-4K-EN",
    created_at: "2024-01-20T12:00:00Z",
    updated_at: "2024-01-20T12:00:00Z"
  }
];

export const mockDeliveryStatuses = {
  "CONTENT-001": [
    {
      booking_id: "QW-BOOK-001",
      content_id: "CONTENT-001",
      package_uuid: "PKG-UUID-001",
      status: "completed" as const,
      theatre_name: "Regal Union Square",
      delivery_date: "2024-01-17T10:15:00Z",
      progress: 100
    },
    {
      booking_id: "QW-BOOK-002",
      content_id: "CONTENT-001",
      package_uuid: "PKG-UUID-001",
      status: "downloading" as const,
      theatre_name: "AMC Empire 25",
      progress: 75
    },
    {
      booking_id: "QW-BOOK-004",
      content_id: "CONTENT-001",
      package_uuid: "PKG-UUID-001",
      status: "shipped" as const,
      theatre_name: "Cinemark Times Square",
      progress: 100
    }
  ],
  "CONTENT-002": [
    {
      booking_id: "QW-BOOK-003",
      content_id: "CONTENT-002",
      package_uuid: "PKG-UUID-002",
      status: "pending" as const,
      theatre_name: "Cinemark Century City"
    },
    {
      booking_id: "QW-BOOK-005",
      content_id: "CONTENT-002",
      package_uuid: "PKG-UUID-002",
      status: "failed" as const,
      theatre_name: "AMC Lincoln Square",
      progress: 0
    },
    {
      booking_id: "QW-BOOK-006",
      content_id: "CONTENT-002",
      package_uuid: "PKG-UUID-002",
      status: "cancelled" as const,
      theatre_name: "Regal Battery Park"
    }
  ]
};