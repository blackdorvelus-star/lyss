                    <div key={apt.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: apt.appointment_type?.color || '#3b82f6' }}
                            />
                            <h3 className="font-semibold">{apt.title || `Rendez-vous avec ${apt.client_name}`}</h3>
                            <Badge className={`
                              ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                              ${apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                              ${apt.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                            `}>
                              {getStatusLabel(apt.status)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(new Date(apt.start_time), "HH:mm", { locale: fr })} - {format(new Date(apt.end_time), "HH:mm", { locale: fr })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{apt.client_name}</span>
                              </div>
                              {apt.client_email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm">{apt.client_email}</span>
                                </div>
                              )}
                              {apt.client_phone && (
                                <div className="flex items-center gap-2">
                                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm">{apt.client_phone}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              {apt.location && (
                                <div className="flex items-center gap-2">
                                  {apt.location.includes('http') ? (
                                    <Video className="w-4 h-4 text-muted-foreground" />
                                  ) : apt.location === 'Phone call' ? (
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  <span className="text-sm">
                                    {apt.location.includes('http') ? 'Visio-conférence' : apt.location}
                                  </span>
                                </div>
                              )}
                              {apt.meeting_link && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={apt.meeting_link} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Rejoindre
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {apt.description && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-muted-foreground">{apt.description}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <Button variant="ghost" size="sm">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground">Aucun rendez-vous aujourd'hui</p>
                  <p className="text-sm text-muted-foreground mt-1">Profitez-en pour planifier votre journée !</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Types de rendez-vous</CardTitle>
              <CardDescription>Configurez les différents types de rendez-vous que vous proposez</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {appointmentTypes.map(type => (
                  <div key={type.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: type.color }}
                        />
                        <h3 className="font-semibold">{type.name}</h3>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {type.duration_minutes} min
                      </Badge>
                    </div>
                    {type.description && (
                      <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Modifier
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Add new type card */}
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Nouveau type</h3>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez un nouveau type de rendez-vous
                  </p>
                </div>
              </div>
              
              {appointmentTypes.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground mb-4">Aucun type de rendez-vous configuré</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer votre premier type
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-sm text-muted-foreground">
        <p>📅 L'agenda se synchronise automatiquement avec vos créneaux disponibles.</p>
        <p>🔔 Les rappels sont envoyés 24h et 1h avant chaque rendez-vous.</p>
        <p>🔄 Utilisez "Générer créneaux" pour mettre à jour vos disponibilités.</p>
      </div>
    </div>
  );
};

export default CalendarSection;
