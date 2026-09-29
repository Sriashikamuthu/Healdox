import { useState } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, Globe, MapPin, Stethoscope, Pill } from 'lucide-react';

const MEDICINE_SYSTEMS = [
  { id: 'allopathy', name: 'Allopathy (Modern Medicine)' },
  { id: 'homeopathy', name: 'Homeopathy' },
  { id: 'ayurveda', name: 'Ayurveda' },
  { id: 'siddha', name: 'Siddha' },
  { id: 'unani', name: 'Unani' },
  { id: 'naturopathy', name: 'Naturopathy' },
  { id: 'other', name: 'Other' },
];

const COMMON_SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Hematology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Rheumatology',
  'Urology',
  'General Medicine',
  'Family Medicine',
  'Internal Medicine',
  'Emergency Medicine',
  'Anesthesiology',
  'Radiology',
  'Pathology',
  'Surgery',
  'Obstetrics & Gynecology',
  'Ophthalmology',
  'ENT (Otolaryngology)',
  'Nephrology',
];

interface SearchFilters {
  searchTerm: string;
  countries: string[];
  states: string[];
  cities: string[];
  medicineSystems: string[];
  specialties: string[];
  onlineConsultation: boolean | null;
}

interface AdvancedPhysicianSearchProps {
  onSearch: (filters: SearchFilters) => void;
  availableCountries: string[];
  availableStates: string[];
  availableCities: string[];
  availableSpecialties: string[];
}

export function AdvancedPhysicianSearch({
  onSearch,
  availableCountries,
  availableStates,
  availableCities,
  availableSpecialties,
}: AdvancedPhysicianSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedMedicineSystems, setSelectedMedicineSystems] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [onlineConsultationFilter, setOnlineConsultationFilter] = useState<boolean | null>(null);

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);

  const handleSearch = () => {
    onSearch({
      searchTerm,
      countries: selectedCountries,
      states: selectedStates,
      cities: selectedCities,
      medicineSystems: selectedMedicineSystems,
      specialties: selectedSpecialties,
      onlineConsultation: onlineConsultationFilter,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCountries([]);
    setSelectedStates([]);
    setSelectedCities([]);
    setSelectedMedicineSystems([]);
    setSelectedSpecialties([]);
    setOnlineConsultationFilter(null);
    onSearch({
      searchTerm: '',
      countries: [],
      states: [],
      cities: [],
      medicineSystems: [],
      specialties: [],
      onlineConsultation: null,
    });
  };

  const toggleSelection = (value: string, selectedList: string[], setSelectedList: (list: string[]) => void) => {
    if (selectedList.includes(value)) {
      setSelectedList(selectedList.filter(item => item !== value));
    } else {
      setSelectedList([...selectedList, value]);
    }
  };

  const removeFilter = (value: string, selectedList: string[], setSelectedList: (list: string[]) => void) => {
    setSelectedList(selectedList.filter(item => item !== value));
  };

  const allSpecialties = Array.from(new Set([...COMMON_SPECIALTIES, ...availableSpecialties])).sort();

  const hasActiveFilters = selectedCountries.length > 0 || selectedStates.length > 0 ||
    selectedCities.length > 0 || selectedMedicineSystems.length > 0 ||
    selectedSpecialties.length > 0 || onlineConsultationFilter !== null || searchTerm.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, institution, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Advanced
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Search
            </button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Active Filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCountries.map(country => (
              <span key={country} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <Globe className="w-3 h-3" />
                {country}
                <button onClick={() => removeFilter(country, selectedCountries, setSelectedCountries)} className="hover:text-green-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedStates.map(state => (
              <span key={state} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">
                <MapPin className="w-3 h-3" />
                {state}
                <button onClick={() => removeFilter(state, selectedStates, setSelectedStates)} className="hover:text-teal-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedCities.map(city => (
              <span key={city} className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm">
                <MapPin className="w-3 h-3" />
                {city}
                <button onClick={() => removeFilter(city, selectedCities, setSelectedCities)} className="hover:text-cyan-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedMedicineSystems.map(system => (
              <span key={system} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                <Pill className="w-3 h-3" />
                {MEDICINE_SYSTEMS.find(m => m.id === system)?.name || system}
                <button onClick={() => removeFilter(system, selectedMedicineSystems, setSelectedMedicineSystems)} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedSpecialties.map(specialty => (
              <span key={specialty} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                <Stethoscope className="w-3 h-3" />
                {specialty}
                <button onClick={() => removeFilter(specialty, selectedSpecialties, setSelectedSpecialties)} className="hover:text-orange-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {onlineConsultationFilter !== null && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                Online Available
                <button onClick={() => setOnlineConsultationFilter(null)} className="hover:text-indigo-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
        )}

        {showAdvanced && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Country
                </label>
                <button
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="text-gray-700">
                    {selectedCountries.length > 0 ? `${selectedCountries.length} selected` : 'Select countries'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {showCountryDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {availableCountries.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">No countries available</div>
                    ) : (
                      availableCountries.map(country => (
                        <label key={country} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCountries.includes(country)}
                            onChange={() => toggleSelection(country, selectedCountries, setSelectedCountries)}
                            className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{country}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  State/Region
                </label>
                <button
                  onClick={() => setShowStateDropdown(!showStateDropdown)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="text-gray-700">
                    {selectedStates.length > 0 ? `${selectedStates.length} selected` : 'Select states'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {showStateDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {availableStates.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">No states available</div>
                    ) : (
                      availableStates.map(state => (
                        <label key={state} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStates.includes(state)}
                            onChange={() => toggleSelection(state, selectedStates, setSelectedStates)}
                            className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{state}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  City
                </label>
                <button
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="text-gray-700">
                    {selectedCities.length > 0 ? `${selectedCities.length} selected` : 'Select cities'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {showCityDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {availableCities.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">No cities available</div>
                    ) : (
                      availableCities.map(city => (
                        <label key={city} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCities.includes(city)}
                            onChange={() => toggleSelection(city, selectedCities, setSelectedCities)}
                            className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{city}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Pill className="w-4 h-4 inline mr-1" />
                  Medicine System
                </label>
                <button
                  onClick={() => setShowMedicineDropdown(!showMedicineDropdown)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="text-gray-700">
                    {selectedMedicineSystems.length > 0 ? `${selectedMedicineSystems.length} selected` : 'Select systems'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {showMedicineDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {MEDICINE_SYSTEMS.map(system => (
                      <label key={system.id} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMedicineSystems.includes(system.id)}
                          onChange={() => toggleSelection(system.id, selectedMedicineSystems, setSelectedMedicineSystems)}
                          className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{system.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Stethoscope className="w-4 h-4 inline mr-1" />
                  Specialty
                </label>
                <button
                  onClick={() => setShowSpecialtyDropdown(!showSpecialtyDropdown)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="text-gray-700">
                    {selectedSpecialties.length > 0 ? `${selectedSpecialties.length} selected` : 'Select specialties'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {showSpecialtyDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {allSpecialties.map(specialty => (
                      <label key={specialty} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSpecialties.includes(specialty)}
                          onChange={() => toggleSelection(specialty, selectedSpecialties, setSelectedSpecialties)}
                          className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{specialty}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Online Consultation</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOnlineConsultationFilter(true)}
                    className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                      onlineConsultationFilter === true
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setOnlineConsultationFilter(null)}
                    className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                      onlineConsultationFilter === null
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Any
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
