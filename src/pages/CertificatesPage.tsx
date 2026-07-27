import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { CertificateGenerator } from '@/components/Dashboard/CertificateGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CertificatesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const [{ data: certs }, { data: prof }] = await Promise.all([
        supabase.from('certificates').select('*, courses(title)').eq('user_id', user.id).order('issued_at', { ascending: false }),
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      ]);
      setCertificates(certs || []);
      setProfile(prof);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="max-w-3xl mx-auto py-12 px-4"><LogoLoader text="Loading certificates..." /></div>;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">My Certificates</h1>
          <p className="text-sm text-muted-foreground">{certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned</p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No certificates yet. Complete course assessments to earn certificates!</p>
            <Button className="mt-4" onClick={() => navigate('/courses')}>Browse Courses</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {certificates.map(cert => (
            <CertificateGenerator
              key={cert.id}
              userName={profile?.full_name || 'Student'}
              courseName={(cert.courses as any)?.title || 'Course'}
              certificateNumber={cert.certificate_number}
              issuedDate={cert.issued_at}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
