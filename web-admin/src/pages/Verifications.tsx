/**
 * =============================================================================
 * VERIFICATIONS PAGE
 * =============================================================================
 * 
 * MENTOR NOTE: Admin page for reviewing and approving/rejecting
 * driver, vehicle, and company registrations.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePendingVerifications } from '../hooks/useApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type Tab = 'drivers' | 'vehicles' | 'companies';

// Placeholder component for missing/broken images
const DocumentImage: React.FC<{ src?: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => {
  const [hasError, setHasError] = useState(false);
  
  if (!src || hasError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center text-gray-400 ${className}`}>
        <div className="text-center">
          <span className="text-2xl">📄</span>
          <p className="text-xs mt-1">No image</p>
        </div>
      </div>
    );
  }
  
  return (
    <img
      src={src.startsWith('http') ? src : `${API_URL}/${src}`}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

export const Verifications: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('drivers');
  const { data, loading, fetchPending, verifyDriver, verifyVehicle, verifyCompany } = usePendingVerifications();
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
    try {
      if (activeTab === 'drivers') {
        await verifyDriver(id, status);
      } else if (activeTab === 'vehicles') {
        await verifyVehicle(id, status);
      } else {
        await verifyCompany(id, status);
      }
      setSelectedItem(null);
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  const tabs = [
    { id: 'drivers', label: 'Drivers', count: data?.pendingDrivers.length || 0 },
    { id: 'vehicles', label: 'Vehicles', count: data?.pendingVehicles.length || 0 },
    { id: 'companies', label: 'Companies', count: data?.pendingCompanies.length || 0 },
  ];

  const currentItems = activeTab === 'drivers' 
    ? data?.pendingDrivers 
    : activeTab === 'vehicles' 
    ? data?.pendingVehicles 
    : data?.pendingCompanies;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Pending Verifications</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="bg-white rounded-xl shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : currentItems?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No pending {activeTab} to verify
            </div>
          ) : (
            <div className="divide-y">
              {currentItems?.map((item: any) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    selectedItem?._id === item._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {activeTab === 'vehicles' ? item.vehicleNumber : item.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activeTab === 'vehicles' 
                          ? item.licensePlate 
                          : activeTab === 'companies'
                          ? item.companyName
                          : item.email}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {selectedItem ? (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {activeTab === 'vehicles' ? 'Vehicle Details' : 'User Details'}
              </h2>

              {/* Driver Details */}
              {activeTab === 'drivers' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="font-medium">{selectedItem.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium">{selectedItem.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="font-medium">{selectedItem.phone}</p>
                  </div>
                  
                  {/* Driver Documents */}
                  <div>
                    <label className="text-sm text-gray-500 block mb-2">Driver Documents</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">License Front</p>
                        <DocumentImage
                          src={selectedItem.documents?.licenseFront}
                          alt="License Front"
                          className="w-full h-24 object-cover rounded"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">License Back</p>
                        <DocumentImage
                          src={selectedItem.documents?.licenseBack}
                          alt="License Back"
                          className="w-full h-24 object-cover rounded"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Selfie</p>
                        <DocumentImage
                          src={selectedItem.documents?.selfie}
                          alt="Selfie"
                          className="w-full h-24 object-cover rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* View Vehicle Button - Always show to check if driver has registered vehicle */}
                  <button
                    onClick={() => {
                      // Switch to vehicles tab and find vehicle by this driver
                      setActiveTab('vehicles');
                      const vehicle = data?.pendingVehicles.find(
                        (v: any) => v.driverId?._id === selectedItem._id || v.driverId === selectedItem._id
                      );
                      if (vehicle) {
                        setSelectedItem(vehicle);
                      } else {
                        setSelectedItem(null);
                      }
                    }}
                    className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    🚗 View Registered Vehicle
                  </button>

                  {/* Assigned Vehicle Info */}
                  {selectedItem.assignedVehicle && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <label className="text-sm text-blue-600 font-medium block mb-3">
                        🚗 Assigned Vehicle
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Plate:</span>{' '}
                          <span className="font-medium">{selectedItem.assignedVehicle.licensePlate}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span>{' '}
                          <span className="font-medium capitalize">{selectedItem.assignedVehicle.type}</span>
                        </div>
                      </div>
                      
                      {/* Vehicle Documents */}
                      <label className="text-xs text-gray-500 block mb-2">Vehicle Documents</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Vehicle Photo</p>
                          <DocumentImage
                            src={selectedItem.assignedVehicle.documents?.vehiclePhoto}
                            alt="Vehicle"
                            className="w-full h-20 object-cover rounded"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Plate Photo</p>
                          <DocumentImage
                            src={selectedItem.assignedVehicle.documents?.licensePlatePhoto}
                            alt="License Plate"
                            className="w-full h-20 object-cover rounded"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">OR/CR (Ownership)</p>
                          <DocumentImage
                            src={selectedItem.assignedVehicle.documents?.orCrPhoto}
                            alt="OR/CR Ownership Proof"
                            className="w-full h-20 object-cover rounded"
                          />
                        </div>
                      </div>

                      {/* View Vehicle Details Button */}
                      <button
                        onClick={() => {
                          setActiveTab('vehicles');
                          // Find and select the vehicle in vehicles tab
                          const vehicle = data?.pendingVehicles.find(
                            (v: any) => v._id === selectedItem.assignedVehicle._id
                          );
                          if (vehicle) {
                            setSelectedItem(vehicle);
                          } else {
                            // Navigate to vehicles page with vehicle ID
                            navigate(`/vehicles?vehicleId=${selectedItem.assignedVehicle._id}`);
                          }
                        }}
                        className="mt-3 w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        🔍 View Vehicle Details
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle Details */}
              {activeTab === 'vehicles' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Vehicle Number</label>
                    <p className="font-medium">{selectedItem.vehicleNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">License Plate</label>
                    <p className="font-medium">{selectedItem.licensePlate}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Type</label>
                    <p className="font-medium capitalize">{selectedItem.type}</p>
                  </div>
                  {selectedItem.routeName && (
                    <div>
                      <label className="text-sm text-gray-500">Route</label>
                      <p className="font-medium">{selectedItem.routeName}</p>
                    </div>
                  )}
                  
                  {/* Driver Info if assigned */}
                  {selectedItem.driverId && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="text-sm text-gray-500">Registered By</label>
                      <p className="font-medium">{selectedItem.driverId.name || 'Driver'}</p>
                      <p className="text-sm text-gray-500">{selectedItem.driverId.email}</p>
                    </div>
                  )}
                  
                  {/* Photos */}
                  <div>
                    <label className="text-sm text-gray-500 block mb-2">Vehicle Documents</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Vehicle Photo</p>
                        <DocumentImage
                          src={selectedItem.documents?.vehiclePhoto}
                          alt="Vehicle"
                          className="w-full h-28 object-cover rounded"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">License Plate</p>
                        <DocumentImage
                          src={selectedItem.documents?.licensePlatePhoto}
                          alt="License Plate"
                          className="w-full h-28 object-cover rounded"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">OR/CR (Ownership Proof)</p>
                        <DocumentImage
                          src={selectedItem.documents?.orCrPhoto}
                          alt="OR/CR Ownership Proof"
                          className="w-full h-28 object-cover rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ownership verification note */}
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ <strong>Verify Ownership:</strong> Check that the OR/CR document matches the license plate and the driver's name before approving.
                    </p>
                  </div>
                </div>
              )}

              {/* Company Details */}
              {activeTab === 'companies' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Company Name</label>
                    <p className="font-medium">{selectedItem.companyName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Contact Name</label>
                    <p className="font-medium">{selectedItem.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium">{selectedItem.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Address</label>
                    <p className="font-medium">{selectedItem.companyAddress}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => handleVerify(selectedItem._id, 'approved')}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleVerify(selectedItem._id, 'rejected')}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Select an item to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
