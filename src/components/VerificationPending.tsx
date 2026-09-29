import React from 'react';
import { Clock, Shield, CheckCircle, Mail } from 'lucide-react';
import { Profile } from '../types/database';

interface VerificationPendingProps {
  profile: Profile;
}

export function VerificationPending({ profile }: VerificationPendingProps) {
  const getRoleSpecificMessage = () => {
    switch (profile.role) {
      case 'physician':
        return {
          title: 'Physician Account Pending Verification',
          message: 'Your physician account is currently under review by our administrators. This verification process ensures the integrity and security of our healthcare platform.',
          details: [
            'License number verification',
            'Specialty and institution confirmation',
            'Professional credentials review',
          ],
        };
      case 'hospital':
        return {
          title: 'Hospital Account Pending Verification',
          message: 'Your hospital account is being reviewed by our administrators. We verify all healthcare institutions to maintain platform trust and safety.',
          details: [
            'Hospital registration verification',
            'Facility credentials review',
            'Administrative approval process',
          ],
        };
      case 'pharma_company':
        return {
          title: 'Pharmaceutical Company Account Pending Verification',
          message: 'Your pharmaceutical company account is under administrative review. All company accounts are verified to ensure compliance and legitimacy.',
          details: [
            'Company registration verification',
            'Business credentials review',
            'Compliance documentation check',
          ],
        };
      default:
        return {
          title: 'Account Pending Verification',
          message: 'Your account is currently being reviewed by our administrators.',
          details: [],
        };
    }
  };

  const content = getRoleSpecificMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <Clock className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">{content.title}</h1>
            <p className="text-center text-blue-100">
              Welcome, {profile.full_name || profile.username}
            </p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {content.message}
              </p>

              {content.details.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Verification Process
                  </h3>
                  <ul className="space-y-3">
                    {content.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex gap-3">
                  <Mail className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-2">
                      What happens next?
                    </h4>
                    <ul className="text-yellow-800 space-y-2 text-sm">
                      <li>• Our admin team will review your registration details</li>
                      <li>• You'll receive an email notification once verified</li>
                      <li>• Verification typically takes 24-48 hours</li>
                      <li>• You can check back anytime to see your status</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Check Verification Status
              </button>
              <button
                onClick={() => window.location.href = 'mailto:support@healdox.com'}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Contact Support
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Having trouble? Need urgent assistance?
              </p>
              <p className="text-sm text-gray-500">
                Contact us at <a href="mailto:support@healdox.com" className="text-blue-600 hover:underline">support@healdox.com</a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Thank you for your patience. We're committed to maintaining a trusted healthcare community.</p>
        </div>
      </div>
    </div>
  );
}
