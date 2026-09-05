import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { toast } from 'sonner';
import { PARENT_INVITE_KEY } from './ParentAuthPage';

/**
 * The link a teacher or child shares: /parents/join/ABC123.
 * Signed in → connect straight away. Signed out → hold the code and
 * send the parent to their own sign-in.
 */
const ParentInvitePage: React.FC = () => {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Connecting you to your child…');

  useEffect(() => {
    (async () => {
      const clean = code.trim().toUpperCase();
      if (!clean) { navigate('/parents', { replace: true }); return; }
      localStorage.setItem(PARENT_INVITE_KEY, clean);

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate(`/parents?invite=${clean}`, { replace: true });
        return;
      }

      await supabase.from('profiles').upsert({ id: data.session.user.id, role: 'guardian' }, { onConflict: 'id' });
      const { error } = await supabase.rpc('redeem_guardian_link_code', { _code: clean });
      localStorage.removeItem(PARENT_INVITE_KEY);
      localStorage.removeItem('edu-zambia-profile-cache');
      if (error) {
        setMessage(error.message);
        toast.error(error.message);
        setTimeout(() => window.location.replace('/family?tab=link'), 1500);
        return;
      }
      toast.success('Connected — welcome to your parent dashboard.');
      window.location.replace('/family');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <LogoLoader text={message} />
    </div>
  );
};

export default ParentInvitePage;
