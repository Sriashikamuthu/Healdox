import { useState, useEffect } from 'react';
import { Stethoscope, MapPin, Award, MessageSquare, Calendar, Globe, Languages } from 'lucide-react';

import { ConsultationRequestModal } from './ConsultationRequestModal';
import { CounsellingRequestModal } from './CounsellingRequestModal';
import { ConnectButton } from './ConnectButton';
import { AdvancedPhysicianSearch } from './AdvancedPhysicianSearch';
import { useAuth } from '../contexts/AuthContext';

interface Physician {
  id: string;
  username: string;
  full_name: string;
  specialty: string;
  specialties: string[];
  institution: string;
  medicine_system: string;
  bio: string;
  avatar_url: string;
  is_verified: boolean;
  country: string;
  state: string;
  city: string;
  languages_spoken: string[];
  years_of_experience: number;
  consultation_fee: number;
  available_for_online_consultation: boolean;
}

interface SearchFilters {
  searchTerm: string;
  countries: string[];
  states: string[];
  cities: string[];
  medicineSystems: string[];
  specialties: string[];
  onlineConsultation: boolean | null;
}

export function PhysicianList() {
  const { user } = useAuth();
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [filteredPhysicians, setFilteredPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhysician, setSelectedPhysician] = useState<Physician | null>(null);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showCounsellingModal, setShowCounsellingModal] = useState(false);

  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);

  useEffect(() => {
    fetchPhysicians();
  }, []);

  useEffect(() => {
    extractFilterOptions();
  }, [physicians]);

  const fetchPhysicians = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'physician')
        .eq('is_verified', true)
        .order('full_name');

      if (error) throw error;
      setPhysicians(data || []);
      setFilteredPhysicians(data || []);
    } catch (error) {
      console.error('Error fetching physicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractFilterOptions = () => {
    const countries = new Set<string>();
    const states = new Set<string>();
    const cities = new Set<string>();
    const specialties = new Set<string>();

    physicians.forEach(physician => {
      if (physician.country) countries.add(physician.country);
      if (physician.state) states.add(physician.state);
      if (physician.city) cities.add(physician.city);
      if (physician.specialty) specialties.add(physician.specialty);
      if (physician.specialties) {
        physician.specialties.forEach(s => specialties.add(s));
      }
    });

    setAvailableCountries(Array.from(countries).sort());
    setAvailableStates(Array.from(states).sort());
    setAvailableCities(Array.from(cities).sort());
    setAvailableSpecialties(Array.from(specialties).sort());
  };

  const handleSearch = (filters: SearchFilters) => {
    let filtered = [...physicians];

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(physician =>
        physician.full_name?.toLowerCase().includes(term) ||
        physician.specialty?.toLowerCase().includes(term) ||
        physician.institution?.toLowerCase().includes(term) ||
        physician.bio?.toLowerCase().includes(term) ||
        physician.specialties?.some(s => s.toLowerCase().includes(term))
      );
    }

    if (filters.countries.length > 0) {
      filtered = filtered.filter(physician =>
        physician.country && filters.countries.includes(physician.country)
      );
    }

    if (filters.states.length > 0) {
      filtered = filtered.filter(physician =>
        physician.state && filters.states.includes(physician.state)
      );
    }

    if (filters.cities.length > 0) {
      filtered = filtered.filter(physician =>
        physician.city && filters.cities.includes(physician.city)
      );
    }

    if (filters.medicineSystems.length > 0) {
      filtered = filtered.filter(physician =>
        physician.medicine_system && filters.medicineSystems.includes(physician.medicine_system)
      );
    }

    if (filters.specialties.length > 0) {
      filtered = filtered.filter(physician => {
        const physicianSpecialties = [
          physician.specialty,
          ...(physician.specialties || [])
        ].filter(Boolean);
        return filters.specialties.some(s => physicianSpecialties.includes(s));
      });
    }

    if (filters.onlineConsultation === true) {
      filtered = filtered.filter(physician => physician.available_for_online_consultation);
    }

    setFilteredPhysicians(filtered);
  };

  const handleRequestConsultation = (physician: Physician) => {
    if (!user) {
      alert('Please sign in to request a consultation');
      return;
    }
    setSelectedPhysician(physician);
    setShowConsultModal(true);
  };

  const handleRequestCounselling = (physician: Physician) => {
    if (!user) {
      alert('Please sign in to request counselling');
      return;
    }
    setSelectedPhysician(physician);
    setShowCounsellingModal(true);
  };

  return (
    <div className="w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Physician</h1>
        <p className="text-gray-600">
          Connect with verified healthcare professionals worldwide. Search by location, specialty, and medicine system.
        </p>
      </div>

      <div className="mb-6">
        <AdvancedPhysicianSearch
          onSearch={handleSearch}
          availableCountries={availableCountries}
          availableStates={availableStates}
          availableCities={availableCities}
          availableSpecialties={availableSpecialties}
        />
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredPhysicians.length} of {physicians.length} physicians
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading physicians...</div>
      ) : filteredPhysicians.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          No physicians found matching your criteria.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhysicians.map((physician) => (
            <div key={physician.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {physician.avatar_url ? (
                      <img
                        src={physician.avatar_url}
                        alt={physician.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Stethoscope className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">
                        Dr. {physician.full_name}
                      </h3>
                      {physician.is_verified && (
                        <Award className="w-4 h-4 text-blue-600 flex-shrink-0" title="Verified" />
                      )}
                    </div>
                    <p className="text-sm text-blue-600 font-medium">{physician.specialty}</p>
                    {physician.years_of_experience && (
                      <p className="text-xs text-gray-500">{physician.years_of_experience}+ years exp.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex flex-wrap gap-1">
                    {physician.medicine_system && (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        {physician.medicine_system.charAt(0).toUpperCase() + physician.medicine_system.slice(1)}
                      </span>
                    )}
                    {physician.available_for_online_consultation && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        Online
                      </span>
                    )}
                  </div>

                  {(physician.city || physician.state || physician.country) && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Globe className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {[physician.city, physician.state, physician.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{physician.institution}</span>
                  </div>

                  {physician.specialties && physician.specialties.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                      {physician.specialties.slice(0, 3).map((spec, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {spec}
                        </span>
                      ))}
                      {physician.specialties.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          +{physician.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {physician.languages_spoken && physician.languages_spoken.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Languages className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {physician.languages_spoken.slice(0, 2).join(', ')}
                        {physician.languages_spoken.length > 2 && ` +${physician.languages_spoken.length - 2}`}
                      </span>
                    </div>
                  )}

                  {physician.consultation_fee && (
                    <div className="text-sm font-medium text-gray-900">
                      From ${physician.consultation_fee.toFixed(2)}
                    </div>
                  )}

                  {physician.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">{physician.bio}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <ConnectButton userId={physician.id} userName={physician.full_name} />
                  <button
                    onClick={() => handleRequestConsultation(physician)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Request Consultation
                  </button>
                  <button
                    onClick={() => handleRequestCounselling(physician)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Request Counselling
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPhysician && (
        <>
          <ConsultationRequestModal
            isOpen={showConsultModal}
            onClose={() => {
              setShowConsultModal(false);
              setSelectedPhysician(null);
            }}
            physicianId={selectedPhysician.id}
            physicianName={selectedPhysician.full_name}
            physicianSpecialty={selectedPhysician.specialty}
          />
          <CounsellingRequestModal
            isOpen={showCounsellingModal}
            onClose={() => {
              setShowCounsellingModal(false);
              setSelectedPhysician(null);
            }}
            physicianId={selectedPhysician.id}
            physicianName={selectedPhysician.full_name}
            physicianSpecialty={selectedPhysician.specialty}
          />
        </>
      )}
    </div>
  );
}
