import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateIncident } from '../hooks';
import { formatRelativeTime } from '../lib/utils';
import { cn } from '../lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/Card';
import { Badge, SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Separator } from '../components/ui/Separator';
import { AlertTriangle, MapPin, Loader2, RefreshCw, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { ErrorState, EmptyState } from '../components/ui/States';
import { Alert } from '../components/ui/Alert';

const sourceOptions = [
  { value: 'citizen_report', label: 'Citizen Report' },
  { value: 'sensor', label: 'Sensor' },
  { value: 'emergency_call', label: 'Emergency Call' },
  { value: 'field_team', label: 'Field Team' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'government', label: 'Government' },
];

const incidentTypeOptions = [
  { value: 'flood', label: 'Flood' },
  { value: 'fire', label: 'Fire' },
  { value: 'industrial_accident', label: 'Industrial Accident' },
  { value: 'road_accident', label: 'Road Accident' },
  { value: 'medical_emergency', label: 'Medical Emergency' },
  { value: 'structural_collapse', label: 'Structural Collapse' },
  { value: 'other', label: 'Other' },
];

const severityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function ReportIncidentPage() {
  const navigate = useNavigate();
  const createIncident = useCreateIncident();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState({});
  const [submitError, setSubmitError] = React.useState(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(null);

  const [formData, setFormData] = React.useState({
    source: 'citizen_report',
    description: '',
    incident_type: '',
    reporter_contact: '',
    location: {
      lat: '',
      lng: '',
      address: '',
    },
    raw_payload: {},
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 5000) {
      errors.description = 'Description must not exceed 5000 characters';
    }

    if (!formData.location.lat || !formData.location.lng) {
      errors.location = 'Latitude and longitude are required';
    } else {
      const lat = parseFloat(formData.location.lat);
      const lng = parseFloat(formData.location.lng);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.location = 'Latitude must be between -90 and 90';
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.location = 'Longitude must be between -180 and 180';
      }
    }

    if (!formData.incident_type) {
      errors.incident_type = 'Incident type is required';
    }

    if (!formData.source) {
      errors.source = 'Source is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const field = name.replace('location.', '');
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [field]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleTextareaChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    const payload = {
      source: formData.source,
      description: formData.description.trim(),
      incident_type: formData.incident_type || undefined,
      reporter_contact: formData.reporter_contact.trim() || undefined,
      location: {
        lat: parseFloat(formData.location.lat),
        lng: parseFloat(formData.location.lng),
        address: formData.location.address.trim() || undefined,
      },
      raw_payload: formData.raw_payload,
    };

    try {
      const result = await createIncident.mutateAsync(payload);
      setSubmitSuccess(result);
      setFormData({
        source: 'citizen_report',
        description: '',
        incident_type: '',
        reporter_contact: '',
        location: { lat: '', lng: '', address: '' },
        raw_payload: {},
      });
    } catch (err) {
      const message = err?.userMessage || err?.message || 'Failed to create incident';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormErrors(prev => ({ ...prev, location: 'Geolocation not supported by browser' }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
          },
        }));
      },
      (err) => {
        setFormErrors(prev => ({ ...prev, location: `Failed to get location: ${err.message}` }));
      }
    );
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-page-title text-text-primary">Report New Incident</h1>
          <p className="text-secondary text-text-muted mt-0.5">Submit a new emergency incident report</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/incidents')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </div>
      </div>

      {submitSuccess && (
        <Alert
          variant="success"
          description={
            <>
              Incident created successfully. ID: <strong className="font-mono">{submitSuccess.id}</strong>
              <Button variant="ghost" size="sm" className="ml-3" onClick={() => navigate(`/incidents/${submitSuccess.id}`)}>
                View Details
              </Button>
            </>
          }
        >
          <CheckCircle className="h-4 w-4 text-severity-low" />
        </Alert>
      )}

      {submitError && (
        <Alert
          variant="destructive"
          description={submitError}
        >
          <XCircle className="h-4 w-4 text-severity-critical" />
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Incident Details</CardTitle>
          <CardDescription className="text-sm">
            All fields marked with <span className="text-severity-critical">*</span> are required
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="source" className="flex items-center gap-1">
                Source <span className="text-severity-critical">*</span>
              </Label>
              <Select value={formData.source} onValueChange={(v) => setFormData(prev => ({ ...prev, source: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.source && (
                <p className="text-xs text-severity-critical">{formErrors.source}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="incident_type" className="flex items-center gap-1">
                Incident Type <span className="text-severity-critical">*</span>
              </Label>
              <Select value={formData.incident_type} onValueChange={(v) => setFormData(prev => ({ ...prev, incident_type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.incident_type && (
                <p className="text-xs text-severity-critical">{formErrors.incident_type}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="flex items-center gap-1">
              Description <span className="text-severity-critical">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleTextareaChange}
              placeholder="Describe the incident in detail (minimum 10 characters)..."
              rows={4}
              className={cn(formErrors.description && 'border-severity-critical')}
            />
            <p className="text-xs text-text-muted text-right">
              {formData.description.length}/5000 characters
            </p>
            {formErrors.description && (
              <p className="text-xs text-severity-critical">{formErrors.description}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              Location <span className="text-severity-critical">*</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="lat" className="text-xs text-text-muted">Latitude</Label>
                <Input
                  id="lat"
                  name="location.lat"
                  type="number"
                  step="0.000001"
                  value={formData.location.lat}
                  onChange={handleChange}
                  placeholder="e.g., 28.6139"
                  className={cn(formErrors.location && 'border-severity-critical')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lng" className="text-xs text-text-muted">Longitude</Label>
                <Input
                  id="lng"
                  name="location.lng"
                  type="number"
                  step="0.000001"
                  value={formData.location.lng}
                  onChange={handleChange}
                  placeholder="e.g., 77.2090"
                  className={cn(formErrors.location && 'border-severity-critical')}
                />
              </div>
              <div className="space-y-1 md:col-span-3">
                <Label htmlFor="address" className="text-xs text-text-muted">Address (Optional)</Label>
                <Input
                  id="address"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  placeholder="Street address, landmark, or area name"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation}>
                <MapPin className="h-3.5 w-3.5 mr-1" />
                Use Current Location
              </Button>
              <HelpCircle className="h-4 w-4 text-text-muted" title="Click to auto-fill coordinates from browser geolocation" />
            </div>
            {formErrors.location && (
              <p className="text-xs text-severity-critical">{formErrors.location}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="reporter_contact" className="flex items-center gap-1">
              Reporter Contact (Optional)
            </Label>
            <Input
              id="reporter_contact"
              name="reporter_contact"
              type="tel"
              value={formData.reporter_contact}
              onChange={handleChange}
              placeholder="Phone number or email"
            />
          </div>

          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-5 border-t">
            <Button type="submit" disabled={isSubmitting || createIncident.isPending} className="w-full sm:w-auto">
              {isSubmitting || createIncident.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Incident
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/incidents')} className="w-full sm:w-auto">
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-severity-medium" />
            Submission Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Provide accurate location coordinates for proper dispatch</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Include specific details: what happened, when, visible hazards</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Mention any injured persons, trapped individuals, or immediate dangers</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> AI will auto-classify type and severity based on description</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Duplicate detection will check for nearby similar reports</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}