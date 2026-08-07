'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';
import { Card, CardContent } from '@/components/shared/Card';
import { Select } from '@/components/shared/Select';
import { TextArea } from '@/components/shared/TextArea';
import { applicantService } from '@/services/applicant.service';
import { vacancyService } from '@/services/vacancy.service';
import toast from 'react-hot-toast';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';

export default function BulkImportPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [selectedVacancy, setSelectedVacancy] = useState('');

  const { data: vacancies } = useQuery({
    queryKey: ['vacancies-dropdown'],
    queryFn: () => vacancyService.getAll({ limit: 100 }),
  });

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error('Please paste CSV data');
      return;
    }

    if (!selectedVacancy) {
      toast.error('Please select a vacancy');
      return;
    }

    // Parse CSV
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const applicants = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const applicant: any = { vacancy_id: parseInt(selectedVacancy) };
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (header === 'first_name') applicant.first_name = value;
        else if (header === 'last_name') applicant.last_name = value;
        else if (header === 'email') applicant.email = value;
        else if (header === 'phone') applicant.phone = value;
        else if (header === 'current_stage') applicant.current_stage = value;
        else if (header === 'total_experience') applicant.total_experience = parseFloat(value) || 0;
        else if (header === 'current_company') applicant.current_company = value;
        else if (header === 'current_designation') applicant.current_designation = value;
        else if (header === 'current_city') applicant.current_city = value;
        else if (header === 'current_state') applicant.current_state = value;
        else if (header === 'highest_qualification') applicant.highest_qualification = value;
        else if (header === 'application_date') applicant.application_date = value;
        else applicant[header] = value;
      });
      
      applicants.push(applicant);
    }

    if (applicants.length === 0) {
      toast.error('No valid applicants found in CSV');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await applicantService.bulkImport(applicants);
      if (result.failed > 0) {
        toast.error(`Imported ${result.successful} of ${result.total}. ${result.failed} failed.`);
      } else {
        toast.success(`Successfully imported ${result.successful} applicants`);
      }
      router.push('/recruitment/applicants');
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'current_stage',
      'total_experience',
      'current_company',
      'current_designation',
      'current_city',
      'current_state',
      'highest_qualification',
      'application_date',
    ];
    const sample = [
      'Rahul',
      'Sharma',
      'rahul@email.com',
      '9876543210',
      'Applied',
      '2.5',
      'ABC Corp',
      'Developer',
      'Delhi',
      'Delhi',
      'B.Tech',
      '2026-08-01',
    ];
    const csvContent = [headers.join(','), sample.join(',')].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'applicant_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Bulk Import Applicants"
        description="Import multiple applicants from CSV"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
            >
              <Download size={18} className="mr-2" />
              Download Template
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <FileSpreadsheet size={32} className="text-blue-500" />
            <div>
              <p className="font-medium text-blue-800">CSV Import Instructions</p>
              <p className="text-sm text-blue-600">
                Paste your CSV data below. The first row must contain column headers.
                Download the template to see the required format.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Select Vacancy"
              options={[
                { value: '', label: 'Select Vacancy' },
                ...(vacancies?.items || []).map((v) => ({
                  value: String(v.id),
                  label: `${v.jobTitle} (${v.vacancyCode})`,
                })),
              ]}
              value={selectedVacancy}
              onChange={(e) => setSelectedVacancy(e.target.value)}
            />
          </div>

          <TextArea
            label="CSV Data"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            rows={10}
            placeholder={`first_name,last_name,email,phone,current_stage,total_experience,current_company,current_designation,current_city,current_state,highest_qualification,application_date\nRahul,Sharma,rahul@email.com,9876543210,Applied,2.5,ABC Corp,Developer,Delhi,Delhi,B.Tech,2026-08-01`}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="gold"
              isLoading={isSubmitting}
              onClick={handleImport}
            >
              <Upload size={18} className="mr-2" />
              Import Applicants
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}