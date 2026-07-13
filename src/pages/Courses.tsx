import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, Clock, Users, Star, Search,
  Brain, TrendingUp, ChevronRight, GraduationCap, PlusCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useTeacherStats } from "@/hooks/useTeacherStats";
import { useCourseCatalog } from "@/hooks/useCourseCatalog";
import { LogoLoader } from "@/components/UI/LogoLoader";

// ─── Teacher Courses View ───────────────────────────
function TeacherCoursesView() {
  const { courses, totalStudents, loading } = useTeacherStats();
  const [searchTerm, setSearchTerm] = useState("");

  if (loading) return <div className="flex items-center justify-center py-16"><LogoLoader size="lg" text="Loading your courses..." /></div>;

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-background py-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
            <p className="text-muted-foreground">{courses.length} course{courses.length !== 1 ? 's' : ''} • {totalStudents} student{totalStudents !== 1 ? 's' : ''} enrolled</p>
          </div>
          <Button asChild>
            <Link to="/create-course"><PlusCircle className="w-4 h-4 mr-2" />Create Course</Link>
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search your courses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">{courses.length === 0 ? 'No courses yet' : 'No matches'}</h3>
              <p className="text-muted-foreground mb-4">{courses.length === 0 ? 'Create your first course to get started.' : 'Try a different search term.'}</p>
              {courses.length === 0 && <Button asChild><Link to="/create-course">Create Course</Link></Button>}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(course => (
              <Card key={course.id} className="hover:shadow-lg transition-all group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={course.is_published ? 'default' : 'secondary'}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    {course.subject && <Badge variant="outline">{course.subject}</Badge>}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{course.title}</CardTitle>
                  <CardDescription>{course.grade_level || 'All grades'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-foreground font-medium">{course.enrollment_count}</span>
                      <span className="text-muted-foreground">students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-foreground font-medium">{course.avg_score != null ? `${course.avg_score}%` : 'N/A'}</span>
                      <span className="text-muted-foreground">avg</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild className="flex-1">
                      <Link to={`/course/${course.id}`}>View</Link>
                    </Button>
                    <Button size="sm" asChild className="flex-1">
                      <Link to={`/course/${course.id}/assignments`}>Assignments</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Student Catalog View (Live from DB) ───────────────────────────
function StudentCoursesView() {
  const { courses, loading } = useCourseCatalog();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");

  if (loading) return <div className="flex items-center justify-center py-20"><LogoLoader size="lg" text="Loading courses..." /></div>;

  const subjects = ["All", ...new Set(courses.map(c => c.subject).filter(Boolean) as string[])];

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = selectedSubject === "All" || c.subject === selectedSubject;
    return matchSearch && matchSubject;
  });

  return (
    <div className="bg-background py-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Learning Courses</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Discover courses created by teachers on the platform</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search courses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="px-4 py-2 border rounded-md bg-background text-foreground">
                {subjects.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {courses.length === 0 ? 'No courses available yet' : 'No matches found'}
              </h3>
              <p className="text-muted-foreground">
                {courses.length === 0 ? 'Courses will appear here once teachers publish them.' : 'Try a different search term or subject.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(course => (
              <Card key={course.id} className="group hover:shadow-xl transition-all overflow-hidden">
                {course.thumbnail_url && (
                  <div className="relative">
                    <img src={course.thumbnail_url} alt={course.title} className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    {course.subject && <Badge variant="secondary">{course.subject}</Badge>}
                    {course.grade_level && <Badge variant="outline">{course.grade_level}</Badge>}
                  </div>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{course.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <GraduationCap className="w-4 h-4 mr-1" /><span>{course.instructor_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4 text-primary" />{course.enrollment_count} enrolled</span>
                  </div>
                  <Button asChild className="w-full">
                    <Link to={`/course/${course.id}`}>View Course</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-2xl">
          <CardContent className="p-8 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Need Help with Your Studies?</h3>
              <p className="opacity-90 mb-4">Get instant AI tutoring support for any course or topic</p>
              <div className="flex gap-4">
                <Button asChild variant="secondary"><Link to="/multi-ai-tutor"><Brain className="mr-2 h-4 w-4" />AI Tutor</Link></Button>
                <Button asChild variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  <Link to="/smart-recommendations"><ChevronRight className="mr-2 h-4 w-4" />Recommendations</Link>
                </Button>
              </div>
            </div>
            <Brain className="w-24 h-24 opacity-20 hidden md:block" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Courses() {
  const { profile, loading } = useProfile();

  if (loading) return <div className="flex items-center justify-center py-20"><LogoLoader size="lg" text="Loading..." /></div>;

  if (profile?.role === 'teacher') return <TeacherCoursesView />;
  return <StudentCoursesView />;
}
